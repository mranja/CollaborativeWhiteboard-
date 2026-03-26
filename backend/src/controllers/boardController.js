const Board = require('../models/Board');
const Version = require('../models/Version');
const Invite = require('../models/Invite');
const User = require('../models/User');
const { sendInviteEmail } = require('../utils/email');
const crypto = require('crypto');

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
    const board = await Board.findById(req.params.id).populate('owner collaborators.user', 'name email');
    if (!board) return res.status(404).json({ message: 'Board not found' });
    res.json(board);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getVersions = async (req, res) => {
  try {
    const { boardId } = req.params;
    const versions = await Version.find({ board: boardId })
      .populate('createdBy', 'name')
      .sort({ versionNumber: -1 })
      .limit(20);
    res.json(versions);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.invite = async (req, res) => {
  const { boardId } = req.params;
  const { email, role } = req.body;
  
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
      role: role || 'editor',
      token,
      invitedBy: req.user.id
    });

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/invite/accept/${token}`;
    const inviterName = req.user.name;

    await sendInviteEmail(email, board.title, inviteLink, inviterName);

    res.json({ message: 'Invite sent successfully to ' + email });
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
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    // only owner or editors can save versions
    if (board.owner.toString() !== req.user.id && !board.collaborators.some(c => c.user.toString() === req.user.id && c.role === 'editor')) {
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
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Only owner may delete
    if (board.owner.toString() !== req.user.id) {
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
