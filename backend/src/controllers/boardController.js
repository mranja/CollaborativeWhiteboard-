const Board = require('../models/Board');
const Version = require('../models/Version');

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
  try {
    const board = await Board.create({ title, owner: req.user.id });
    res.json(board);
  } catch (err) { res.status(500).json({ message: err.message }); }
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
  let { userId, role } = req.body;
  try {
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    
    // Only owner can invite
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only board owner can invite' });
    }
    
    // If userId is an email, find the user by email
    if (userId && userId.includes('@')) {
      const User = require('../models/User');
      const user = await User.findOne({ email: userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found. Please provide valid email.' });
      }
      userId = user._id;
    }
    
    // Check if already a collaborator
    const alreadyCollab = board.collaborators.some(c => c.user.toString() === userId.toString());
    if (alreadyCollab) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }
    
    board.collaborators.push({ user: userId, role: role || 'editor' });
    await board.save();
    res.json(board);
  } catch (err) { 
    console.error('Invite error:', err);
    res.status(500).json({ message: err.message || 'Failed to invite' });
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
