const Board = require('../models/Board')
const Version = require('../models/Version');
const jwt = require('jsonwebtoken');
const { canEditBoard, getBoardRole } = require('../utils/boardAccess');

const allowedElementFields = [
  'type',
  'x',
  'y',
  'width',
  'height',
  'rotation',
  'scaleX',
  'scaleY',
  'stroke',
  'strokeWidth',
  'fill',
  'text',
  'src',
  'points',
  'meta'
];

const buildElementSet = (element = {}) => (
  allowedElementFields.reduce((updates, field) => {
    if (element[field] !== undefined) {
      updates[`elements.$.${field}`] = element[field];
    }
    return updates;
  }, {})
);

const acknowledge = (ack, payload) => {
  if (typeof ack === 'function') ack(payload);
};

module.exports = (io) => {
  const nsp = io.of('/board');

  // JWT authentication middleware for socket connections
  nsp.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const secret = process.env.JWT_SECRET || 'supersecretkey123';
      const decoded = jwt.verify(token, secret);
      socket.userId = (decoded.userId || decoded.id)?.toString();
      socket.userName = decoded.name || 'Anonymous';
      socket.userEmail = decoded.email;
      if (!socket.userId) {
        return next(new Error('Authentication error: Invalid token payload'));
      }
      next();
    } catch (err) {
      console.error('Socket auth error:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  nsp.on('connection', (socket) => {
    let currentRoom = null;
    let currentBoardId = null;
    let userRole = null;
    
    // Extract userId and name from authenticated socket
    const userId = socket.userId;
    const name = socket.userName;

    socket.on('join-board', async ({ boardId } = {}, ack) => {
      if (currentRoom) {
        socket.to(currentRoom).emit('user-left', { userId });
        socket.leave(currentRoom);
      }
      currentRoom = null;
      currentBoardId = null;
      userRole = null;
      
      // Determine user role from board or auto-attach user
      try {
        let board = await Board.findById(boardId);
        if (!board) {
          acknowledge(ack, { ok: false, message: 'Board not found' });
          socket.emit('board-error', { message: 'Board not found' });
          return;
        }

        userRole = getBoardRole(board, userId);
        if (!userRole) {
          try {
            await Board.updateOne(
              { _id: board._id, owner: { $ne: userId }, 'collaborators.user': { $ne: userId } },
              { $push: { collaborators: { user: userId, role: 'editor' } } }
            );
            userRole = 'editor';
          } catch (e) {
            userRole = 'editor';
          }
        }

        currentRoom = `board_${boardId}`;
        currentBoardId = boardId;
        socket.join(currentRoom);
        socket.to(currentRoom).emit('user-joined', { userId, name });
        acknowledge(ack, { ok: true, role: userRole });
      } catch (err) {
        console.error('Error fetching board role:', err);
        acknowledge(ack, { ok: false, message: 'Unable to join board' });
        socket.emit('board-error', { message: 'Unable to join board' });
      }
    });

    socket.on('leave-board', ({ boardId }) => {
      const room = `board_${boardId}`;
      socket.to(room).emit('user-left', { userId });
      socket.leave(room);

      if (currentRoom === room) {
        currentRoom = null;
        currentBoardId = null;
        userRole = null;
      }
    });

    // Helper to check if user can edit
    const canEdit = () => canEditBoard(userRole);

    // draw operations are operation-based and broadcast to room
    socket.on('draw-element', async (op = {}, ack) => {
      if (!currentRoom) {
        acknowledge(ack, { ok: false, message: 'Join a board before drawing' });
        return;
      }
      if (!canEdit()) {
        console.warn(`User ${userId} attempted to draw but is ${userRole}`);
        acknowledge(ack, { ok: false, message: 'You do not have permission to edit this board' });
        return;
      }
      if (!op.element?.id) {
        acknowledge(ack, { ok: false, message: 'Element id is required' });
        return;
      }

      try {
        await Board.updateOne(
          { _id: currentBoardId, 'elements.id': { $ne: op.element.id } },
          { $push: { elements: op.element }, $set: { updatedAt: new Date() } }
        );
        socket.to(currentRoom).emit('draw-element', { ...op, userId });
        acknowledge(ack, { ok: true });
      } catch (err) {
        console.error('Persist draw error:', err);
        acknowledge(ack, { ok: false, message: 'Could not save drawing change' });
        socket.emit('board-error', { message: 'Could not save drawing change' });
      }
    });

    socket.on('drawing-preview', (op) => {
      if (!currentRoom) return;
      if (!canEdit()) return;
      socket.to(currentRoom).emit('drawing-preview', { ...op, userId });
    });

    socket.on('update-element', async (op = {}, ack) => {
      if (!currentRoom) {
        acknowledge(ack, { ok: false, message: 'Join a board before updating' });
        return;
      }
      if (!canEdit()) {
        console.warn(`User ${userId} attempted to update but is ${userRole}`);
        acknowledge(ack, { ok: false, message: 'You do not have permission to edit this board' });
        return;
      }
      if (!op.element?.id) {
        acknowledge(ack, { ok: false, message: 'Element id is required' });
        return;
      }

      const elementSet = buildElementSet(op.element);
      if (Object.keys(elementSet).length === 0) {
        acknowledge(ack, { ok: false, message: 'No supported element fields to update' });
        return;
      }

      try {
        await Board.updateOne(
          { _id: currentBoardId, 'elements.id': op.element.id },
          { $set: { ...elementSet, updatedAt: new Date() } }
        );
        socket.to(currentRoom).emit('update-element', op);
        acknowledge(ack, { ok: true });
      } catch (err) {
        console.error('Persist update error:', err);
        acknowledge(ack, { ok: false, message: 'Could not save element update' });
        socket.emit('board-error', { message: 'Could not save element update' });
      }
    });

    socket.on('delete-element', async (op = {}, ack) => {
      if (!currentRoom) {
        acknowledge(ack, { ok: false, message: 'Join a board before deleting' });
        return;
      }
      if (!canEdit()) {
        console.warn(`User ${userId} attempted to delete but is ${userRole}`);
        acknowledge(ack, { ok: false, message: 'You do not have permission to edit this board' });
        return;
      }
      if (!op.elementId) {
        acknowledge(ack, { ok: false, message: 'Element id is required' });
        return;
      }

      try {
        await Board.updateOne(
          { _id: currentBoardId },
          { $pull: { elements: { id: op.elementId } }, $set: { updatedAt: new Date() } }
        );
        socket.to(currentRoom).emit('delete-element', op);
        acknowledge(ack, { ok: true });
      } catch (err) {
        console.error('Persist delete error:', err);
        acknowledge(ack, { ok: false, message: 'Could not delete element' });
        socket.emit('board-error', { message: 'Could not delete element' });
      }
    });

    socket.on('cursor-move', (payload) => {
      if (!currentRoom) return;
      // everyone can move cursor (read-only)
      socket.to(currentRoom).emit('cursor-move', { userId, name, ...payload });
    });

    socket.on('save-version', async (payload) => {
      if (!currentRoom) return;
      if (!canEdit()) {
        console.warn(`User ${userId} attempted to save version but is ${userRole}`);
        return;
      }

      try {
        // persist a snapshot to Versions so HTTP clients and others can fetch it
        const board = await Board.findById(currentBoardId);
        if (!board) return;
        board.version = (board.version || 0) + 1;
        await board.save();
        const version = await Version.create({
          board: board._id,
          snapshot: payload.snapshot || payload,
          versionNumber: board.version,
          createdBy: userId
        });

        // notify others with version metadata
        socket.to(currentRoom).emit('save-version', { versionId: version._id, versionNumber: version.versionNumber });
      } catch (err) {
        console.error('Socket save-version error:', err);
      }
    });

    socket.on('disconnect', () => {
      if (currentRoom) socket.to(currentRoom).emit('user-left', { userId });
    });
  });
};
