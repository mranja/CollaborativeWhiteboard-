const mongoose = require('mongoose');
const Board = require('../models/Board')
const Version = require('../models/Version');
const jwt = require('jsonwebtoken');
const { canEditBoard, getBoardRole } = require('../utils/boardAccess');
const { getJwtSecret } = require('../utils/jwt');

/**
 * Live presence per room: roomName -> Map(userId -> { userId, name, sockets:Set })
 *
 * Without this, a socket that joined a busy room learned about the people
 * already in it only when they happened to move their cursor, so the
 * collaborator list and the "N Active" counter were wrong (and appeared to lag)
 * on every join. Sockets are counted per user so a second tab, or React's
 * StrictMode double-mount in development, does not fire a spurious
 * `user-left` for someone who is still connected.
 */
const roomPresence = new Map();

const listRoomMembers = (room, excludeUserId = null) => {
  const members = roomPresence.get(room);
  if (!members) return [];
  return Array.from(members.values())
    .filter((entry) => entry.userId !== excludeUserId)
    .map((entry) => ({ userId: entry.userId, name: entry.name }));
};

/** Returns true when this is the user's first socket in the room. */
const addPresence = (room, socketId, userId, name) => {
  if (!roomPresence.has(room)) roomPresence.set(room, new Map());
  const members = roomPresence.get(room);
  const existing = members.get(userId);

  if (existing) {
    existing.sockets.add(socketId);
    existing.name = name || existing.name;
    return false;
  }

  members.set(userId, { userId, name, sockets: new Set([socketId]) });
  return true;
};

/** Returns true when the user's last socket left the room. */
const removePresence = (room, socketId, userId) => {
  const members = roomPresence.get(room);
  if (!members) return false;

  const entry = members.get(userId);
  if (!entry) return false;

  entry.sockets.delete(socketId);
  if (entry.sockets.size > 0) return false;

  members.delete(userId);
  if (members.size === 0) roomPresence.delete(room);
  return true;
};

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
      const decoded = jwt.verify(token, getJwtSecret());
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

    const exitRoom = (room) => {
      if (!room) return;
      const wasLast = removePresence(room, socket.id, userId);
      socket.leave(room);
      if (wasLast) socket.to(room).emit('user-left', { userId });
    };

    socket.on('join-board', async ({ boardId } = {}, ack) => {
      exitRoom(currentRoom);
      currentRoom = null;
      currentBoardId = null;
      userRole = null;

      // Reject malformed ids up front: findById would otherwise throw a
      // CastError and surface as a confusing "Unable to join board".
      if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
        acknowledge(ack, { ok: false, message: 'Board not found' });
        socket.emit('board-error', { message: 'Board not found' });
        return;
      }

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

        const isFirstSocketForUser = addPresence(currentRoom, socket.id, userId, name);
        const members = listRoomMembers(currentRoom, userId);

        if (isFirstSocketForUser) {
          socket.to(currentRoom).emit('user-joined', { userId, name });
        }

        // Seed the joiner with everyone already in the room so the
        // collaborator list and active-user count are correct immediately
        // instead of filling in as people move their cursors.
        socket.emit('board-presence', { boardId, members });
        acknowledge(ack, { ok: true, role: userRole, members });
      } catch (err) {
        console.error('Error fetching board role:', err);
        acknowledge(ack, { ok: false, message: 'Unable to join board' });
        socket.emit('board-error', { message: 'Unable to join board' });
      }
    });

    socket.on('leave-board', ({ boardId } = {}) => {
      const room = boardId ? `board_${boardId}` : currentRoom;
      if (!room) return;

      exitRoom(room);

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
      exitRoom(currentRoom);
      currentRoom = null;
      currentBoardId = null;
      userRole = null;
    });
  });
};
