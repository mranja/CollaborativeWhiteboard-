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
mongoose.set('bufferCommands', false);

const app = express();
app.set('trust proxy', 1);

// Ensure critical config
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set. Using default secret (set JWT_SECRET in production).');
}

// CORS configuration - support Vercel deployment, localhost, and configured FRONTEND_URL
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Always allow localhost, any .vercel.app, and configured FRONTEND_URL
    const frontendUrl = process.env.FRONTEND_URL;
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.vercel.app') ||
      (frontendUrl && origin === frontendUrl) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive to allow various preview domains
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const getDbStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: getDbStatus() });
});

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database is not connected. Start MongoDB or set MONGO_URI to a reachable database.',
      database: getDbStatus()
    });
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if ((err.name === 'MongoError' || err.name === 'MongoServerError') && err.code === 11000) {
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

boardSocket(io);

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/whiteboard';
  const displayUri = uri.includes('@') ? uri.split('@').pop() : uri;
  console.log(`📡 Attempting to connect to MongoDB: ${displayUri}`);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 5000
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Server started with database pending. Will retry connection in 10s...');
    setTimeout(connectDB, 10000);
  }
};

const start = async (port = PORT) => {
  await connectDB();
  return new Promise((resolve) => {
    server.listen(port, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      console.log(`Server listening on port ${actualPort}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      resolve(server);
    });
  });
};

if (require.main === module) {
  start().catch((err) => {
    console.error('Server startup failed:', err);
    process.exit(1);
  });
}

module.exports = {
  app,
  connectDB,
  getDbStatus,
  io,
  server,
  start
};
