const Board = require('../models/Board')
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  const nsp = io.of('/board');

  // JWT authentication middleware for socket connections
  nsp.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.userId = decoded.userId;
      socket.userName = decoded.name;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      console.error('Socket auth error:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  nsp.on('connection', (socket) => {
    let currentRoom = null;
    let currentBoardId = null;
    let userRole = 'viewer'; // default to viewer
    
    // Extract userId and name from authenticated socket
    const userId = socket.userId;
    const name = socket.userName;

    socket.on('join-board', async ({ boardId }) => {
      if (currentRoom) socket.leave(currentRoom);
      
      currentRoom = `board_${boardId}`;
      currentBoardId = boardId;
      
      // Determine user role from board
      try {
        const board = await Board.findById(boardId);
        if (board.owner.toString() === userId) {
          userRole = 'owner';
        } else {
          const collab = board.collaborators.find(c => c.user.toString() === userId);
          userRole = collab?.role || 'viewer';
        }
      } catch (err) {
        console.error('Error fetching board role:', err);
        userRole = 'viewer';
      }
      
      socket.join(currentRoom);
      socket.to(currentRoom).emit('user-joined', { userId, name });
    });

    socket.on('leave-board', ({ boardId }) => {
      const room = `board_${boardId}`;
      socket.leave(room);
      socket.to(room).emit('user-left', { userId });
    });

    // Helper to check if user can edit
    const canEdit = () => userRole !== 'viewer';

    // draw operations are operation-based and broadcast to room
    socket.on('draw-element', (op) => {
      if (!currentRoom) return;
      if (!canEdit()) {
        console.warn(`User ${userId} attempted to draw but is ${userRole}`);
        return;
      }
      socket.to(currentRoom).emit('draw-element', op);
    });

    socket.on('update-element', (op) => {
      if (!currentRoom) return;
      if (!canEdit()) {
        console.warn(`User ${userId} attempted to update but is ${userRole}`);
        return;
      }
      socket.to(currentRoom).emit('update-element', op);
    });

    socket.on('delete-element', (op) => {
      if (!currentRoom) return;
      if (!canEdit()) {
        console.warn(`User ${userId} attempted to delete but is ${userRole}`);
        return;
      }
      socket.to(currentRoom).emit('delete-element', op);
    });

    socket.on('cursor-move', (payload) => {
      if (!currentRoom) return;
      // everyone can move cursor (read-only)
      socket.to(currentRoom).emit('cursor-move', { userId, name, ...payload });
    });

    socket.on('save-version', (payload) => {
      if (!currentRoom) return;
      if (userRole !== 'owner') {
        console.warn(`User ${userId} attempted to save version but is ${userRole}`);
        return;
      }
      socket.to(currentRoom).emit('save-version', payload);
    });

    socket.on('disconnect', () => {
      if (currentRoom) socket.to(currentRoom).emit('user-left', { userId });
    });
  });
};
