const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const boardSocket = require('./sockets/boardSocket');

dotenv.config();
const app = express();

// CORS configuration - restrict to frontend URL in production
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

// 404 handler (before error handler)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (must be last)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate field value entered' });
  }
  
  res.status(err.status || 500).json({ 
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions
});

// attach socket handlers
boardSocket(io);

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/whiteboard';
  console.log(`📡 Attempting to connect to MongoDB: ${uri.split('@').pop()}`);
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Running in disconnected mode (features will be limited)');
  }
};

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });
});
