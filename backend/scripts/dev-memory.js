const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-memory-secret-change-me';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.MONGO_TIMEOUT_MS = process.env.MONGO_TIMEOUT_MS || '10000';

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();

  const { server, start } = require('../src/index');
  await start(process.env.PORT || 5000);

  console.log('Using temporary in-memory MongoDB. Data resets when this process stops.');

  const shutdown = async () => {
    console.log('Shutting down dev server...');
    await new Promise((resolve) => server.close(resolve));
    await mongoServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

run().catch((err) => {
  console.error('Failed to start memory-backed dev server:', err);
  process.exit(1);
});
