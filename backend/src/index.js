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

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
  console.log(`Connecting to MongoDB: ${uri.split('@').pop()}`);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 5000
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Running with database unavailable. API routes will return 503 until MongoDB is connected.');
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
