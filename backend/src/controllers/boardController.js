const Board = require('../models/Board');
const Version = require('../models/Version');
const Invite = require('../models/Invite');
const User = require('../models/User');
const { sendInviteEmail } = require('../utils/email');
const { canEditBoard, getBoardRole } = require('../utils/boardAccess');
const crypto = require('crypto');

const loadBoardForUser = async (boardId, userId, populate = false) => {
  let query = Board.findById(boardId);
  if (populate) {
    query = query.populate('owner collaborators.user', 'name email');
  }

  const board = await query;
  if (!board) return { board: null, role: null };

  return { board, role: getBoardRole(board, userId) };
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
    const { board, role } = await loadBoardForUser(req.params.id, req.user.id, true);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!role) return res.status(403).json({ message: 'You do not have access to this board' });

    res.json({ ...board.toObject(), currentUserRole: role });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getVersions = async (req, res) => {
  try {
    const { boardId } = req.params;
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
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    
    // Only owner can invite
    if (board.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only board owner can invite' });
    }

    // Check if user already has an account
    const existingUser = await User.findOne({ email });
    
    // Check if already a collaborator
    if (existingUser) {
      const alreadyCollab = board.collaborators.some(c => c.user.toString() === existingUser._id.toString());
      if (alreadyCollab || board.owner.toString() === existingUser._id.toString()) {
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
    const alreadyCollab = board.collaborators.some(c => c.user.toString() === userId);
    if (!alreadyCollab && board.owner.toString() !== userId) {
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
