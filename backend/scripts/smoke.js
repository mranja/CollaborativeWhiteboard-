const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { io: createSocketClient } = require('socket.io-client');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.MONGO_TIMEOUT_MS = process.env.MONGO_TIMEOUT_MS || '10000';

const { app, connectDB, server } = require('../src/index');

const waitForSocketConnect = (url, token) => new Promise((resolve, reject) => {
  const socket = createSocketClient(`${url}/board`, {
    auth: { token },
    forceNew: true,
    reconnection: false,
    timeout: 5000,
    transports: ['websocket']
  });

  const timeout = setTimeout(() => {
    socket.disconnect();
    reject(new Error('Socket connection timed out'));
  }, 5000);

  socket.once('connect', () => {
    clearTimeout(timeout);
    resolve(socket);
  });

  socket.once('connect_error', (err) => {
    clearTimeout(timeout);
    socket.disconnect();
    reject(err);
  });
});

const emitWithAck = (socket, event, payload) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error(`${event} acknowledgement timed out`));
  }, 5000);

  socket.emit(event, payload, (response) => {
    clearTimeout(timeout);
    if (!response?.ok) {
      reject(new Error(`${event} failed: ${response?.message || 'unknown error'}`));
      return;
    }
    resolve(response);
  });
});

const listenOnRandomPort = () => new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    resolve(`http://127.0.0.1:${address.port}`);
  });
});

const closeServer = () => new Promise((resolve, reject) => {
  if (!server.listening) {
    resolve();
    return;
  }

  server.close((err) => {
    if (err) reject(err);
    else resolve();
  });
});

async function run() {
  let mongoServer;
  let socket;

  try {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();

    await connectDB();
    assert.equal(mongoose.connection.readyState, 1, 'MongoDB should be connected');

    const api = request(app);
    const email = `smoke-${Date.now()}@example.com`;

    const register = await api
      .post('/api/auth/register')
      .send({ name: 'Smoke Test', email, password: 'secret123' })
      .expect(200);

    const token = register.body.token;
    assert.ok(token, 'Register should return a JWT token');

    const createdBoard = await api
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Smoke Board' })
      .expect(200);

    const boardId = createdBoard.body._id;
    assert.ok(boardId, 'Create board should return a board id');

    const loadedBoard = await api
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(loadedBoard.body.currentUserRole, 'owner');
    assert.deepEqual(loadedBoard.body.elements, []);

    const url = await listenOnRandomPort();
    socket = await waitForSocketConnect(url, token);
    await emitWithAck(socket, 'join-board', { boardId });

    const element = {
      id: 'smoke-rect',
      type: 'rect',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      stroke: '#2563eb',
      strokeWidth: 4
    };

    await emitWithAck(socket, 'draw-element', { element });

    const afterDraw = await api
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(afterDraw.body.elements.length, 1);
    assert.equal(afterDraw.body.elements[0].id, element.id);

    await emitWithAck(socket, 'update-element', {
      element: { id: element.id, x: 30, y: 40, text: 'updated' }
    });

    const afterUpdate = await api
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(afterUpdate.body.elements[0].x, 30);
    assert.equal(afterUpdate.body.elements[0].y, 40);
    assert.equal(afterUpdate.body.elements[0].text, 'updated');

    await emitWithAck(socket, 'delete-element', { elementId: element.id });

    const afterDelete = await api
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(afterDelete.body.elements.length, 0);

    console.log('Smoke test passed: auth, boards, and realtime persistence are working.');
  } finally {
    if (socket) socket.disconnect();
    await closeServer();
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }
}

run().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exitCode = 1;
});
