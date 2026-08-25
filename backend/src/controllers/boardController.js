const Board = require('../models/Board');
const Version = require('../models/Version');
const Invite = require('../models/Invite');
const User = require('../models/User');
const { sendInviteEmail } = require('../utils/email');
const { canEditBoard, getBoardRole, normalizeId } = require('../utils/boardAccess');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Collaborator entries can outlive the user they point at (deleted account), and
// a board can end up without an owner. normalizeId returns null for those cases
// instead of throwing on `.toString()` of null, which previously turned an edge
// case into a 500.
const isSameUser = (a, b) => {
  const left = normalizeId(a);
  const right = normalizeId(b);
  return Boolean(left && right && left === right);
};

const hasCollaborator = (board, userId) => (
  (board.collaborators || []).some((c) => isSameUser(c && c.user, userId))
);

const loadBoardForUser = async (boardId, userId, populate = false) => {
  let query = Board.findById(boardId);
  if (populate) {
    query = query.populate('owner collaborators.user', 'name email');
  }

  let board = await query;
  if (!board) return { board: null, role: null };

  let role = getBoardRole(board, userId);

  // If user is authenticated and not yet attached to the board, auto-add as editor collaborator
  if (!role && userId) {
    try {
      await Board.updateOne(
        { _id: board._id, owner: { $ne: userId }, 'collaborators.user': { $ne: userId } },
        { $push: { collaborators: { user: userId, role: 'editor' } } }
      );
      // Reload board with updated collaborator list
      let reloadedQuery = Board.findById(boardId);
      if (populate) {
        reloadedQuery = reloadedQuery.populate('owner collaborators.user', 'name email');
      }
      board = await reloadedQuery;
      role = 'editor';
    } catch (e) {
      console.warn('Auto-join collaborator error:', e.message);
      role = 'editor';
    }
  }

  return { board, role };
};

exports.listUserBoards = async (req, res) => {
  try {
    const userId = req.user.id;
    // Find boards where user is owner OR collaborator
    const boards = await Board.find({
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ]
    })
    .populate('owner', 'name email')
    .populate('collaborators.user', 'name email')
    .sort({ updatedAt: -1 });
    
    res.json(boards);
  } catch (err) {
    console.error('List boards error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createBoard = async (req, res) => {
  const { title } = req.body;
  
  // Input validation
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Board title is required' });
  }
  
  if (title.trim().length > 100) {
    return res.status(400).json({ message: 'Board title must be less than 100 characters' });
  }
  
  try {
    const board = await Board.create({ 
      title: title.trim(), 
      owner: req.user.id 
    });
    res.json(board);
  } catch (err) { 
    console.error('Create board error:', err);
    res.status(500).json({ message: err.message }); 
  }
};

exports.getBoard = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Board not found' });
    }
    const { board, role } = await loadBoardForUser(req.params.id, req.user.id, true);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!role) return res.status(403).json({ message: 'You do not have access to this board' });

    res.json({ ...board.toObject(), currentUserRole: role });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getVersions = async (req, res) => {
  try {
    const { boardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(404).json({ message: 'Board not found' });
    }
    const { board, role } = await loadBoardForUser(boardId, req.user.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!role) return res.status(403).json({ message: 'You do not have access to this board' });

    const versions = await Version.find({ board: boardId })
      .populate('createdBy', 'name')
      .sort({ versionNumber: -1 })
      .limit(20);
    res.json(versions);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.invite = async (req, res) => {
  const { boardId } = req.params;
  const email = req.body.email?.trim().toLowerCase();
  const role = ['viewer', 'editor'].includes(req.body.role) ? req.body.role : 'editor';
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  try {
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Only owner can invite
    if (!isSameUser(board.owner, req.user.id)) {
      return res.status(403).json({ message: 'Only board owner can invite' });
    }

    // Check if user already has an account
    const existingUser = await User.findOne({ email });

    // Check if already a collaborator
    if (existingUser) {
      const alreadyCollab = hasCollaborator(board, existingUser._id);
      if (alreadyCollab || isSameUser(board.owner, existingUser._id)) {
        return res.status(400).json({ message: 'User is already part of the board' });
      }
    }

    // Create invite token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Save invite to DB
    await Invite.create({
      board: boardId,
      email,
      role,
      token,
      invitedBy: req.user.id
    });

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/invite/accept/${token}`;
    const inviterName = req.user.name;

    const emailSent = await sendInviteEmail(email, board.title, inviteLink, inviterName);

    res.json({
      message: emailSent
        ? 'Invite sent successfully to ' + email
        : 'Invite created, but email delivery is not configured. Share the invite link manually.',
      inviteLink,
      emailSent
    });
  } catch (err) { 
    console.error('Invite error:', err);
    res.status(500).json({ message: err.message || 'Failed to invite' });
  }
};

exports.acceptInvite = async (req, res) => {
  const { token } = req.params;
  
  try {
    const invite = await Invite.findOne({ token, status: 'pending' });
    if (!invite) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    const board = await Board.findById(invite.board);
    if (!board) {
      return res.status(404).json({ message: 'Board no longer exists' });
    }

    // User must be logged in to accept, and the email must match or we just add the current user
    const userId = req.user.id;
    
    // Add user as collaborator
    const alreadyCollab = hasCollaborator(board, userId);
    if (!alreadyCollab && !isSameUser(board.owner, userId)) {
      board.collaborators.push({ user: userId, role: invite.role });
      await board.save();
    }

    invite.status = 'accepted';
    await invite.save();

    res.json({ message: 'Invitation accepted', boardId: board._id });
  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.saveVersion = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { snapshot } = req.body;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(404).json({ message: 'Board not found' });
    }
    const { board, role } = await loadBoardForUser(boardId, req.user.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!canEditBoard(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    board.version += 1;
    await board.save();
    const version = await Version.create({ board: board._id, snapshot, versionNumber: board.version, createdBy: req.user.id });
    res.json(version);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Delete a board and related data permanently
exports.deleteBoard = async (req, res) => {
  try {
    const boardId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Only owner may delete
    if (!isSameUser(board.owner, req.user.id)) {
      return res.status(403).json({ message: 'Only the owner can delete this board' });
    }

    // Remove related versions and invites
    await Version.deleteMany({ board: board._id });
    await Invite.deleteMany({ board: board._id });

    // Finally remove the board document
    await Board.deleteOne({ _id: board._id });

    res.json({ message: 'Board deleted permanently' });
  } catch (err) {
    console.error('Delete board error:', err);
    res.status(500).json({ message: err.message || 'Failed to delete board' });
  }
};
