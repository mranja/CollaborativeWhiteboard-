# Collaborative Whiteboard (MERN + Socket.io + Konva)

Production-ready real-time collaborative whiteboard built with MERN stack, Socket.io, Konva.js canvas, and modern React patterns.

## ⚡ Quick Start

### Prerequisites
- **Node.js** 16+
- **MongoDB** running (local or cloud)
- **npm** installed

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in backend folder:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/whiteboard
JWT_SECRET=your-secret-key-min-32-chars-for-production
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

Expected output:
```
[nodemon] starting `node src/index.js`
MongoDB connected
Server listening on 5000
```

### 2. Frontend Setup (New Terminal)

```bash
cd frontend
npm install
```

Create `.env.local` file in frontend folder:
```env
VITE_BACKEND_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

Expected output:
```
VITE v4.x.x built in XXms
➜  Local:   http://localhost:5173/
```

### 3. Start MongoDB (if local)

```bash
mongod
```

### 4. Test Application

- Navigate to http://localhost:5173
- Register a new account
- Create a board
- Invite collaborators by email
- Draw on the canvas

---

## Features Implemented

### Real-time Collaboration
- ✅ Operation-based socket events (draw/update/delete)
- ✅ Room-based broadcast to specific board collaborators
- ✅ Live cursor display with user names and colors
- ✅ Throttled cursor movement (60ms) to reduce socket load
- ✅ **JWT-secured WebSocket connections** (prevents identity spoofing)

### Canvas & Drawing
- ✅ Konva.js canvas with draggable elements
- ✅ Shapes: rectangle, circle, line, sticky note, text
- ✅ Double-click to add rectangle (demo)
- ✅ Drag & resize support

### Authentication & Authorization
- ✅ JWT-based auth (register/login)
- ✅ Token persistence in localStorage
- ✅ Protected routes (redirect to login if no token)
- ✅ Role-based access: owner, editor, viewer
- ✅ **Rate limiting** on auth endpoints (5 attempts/15 min)
- ✅ **Bcrypt password hashing** (10 rounds)

### Role-Based UI & Permissions
- **Owner**: Full access, can invite collaborators, save versions
- **Editor**: Can draw, edit, see live cursors
- **Viewer**: Read-only, see drawings and cursors but cannot edit
- ✅ Backend socket middleware enforces role checks
- ✅ Frontend UI disables editing tools for viewers

### Version History
- ✅ Snapshot saving per board (REST API)
- ✅ Version tracking with timestamps and creators
- ✅ Modal to view version history (restore logic ready)

### User Management
- ✅ Board creation with ownership
- ✅ Invite UI with role selection (email-based)
- ✅ Collaborators sidebar showing active users
- ✅ User join/leave notifications

### UI/UX
- ✅ Modern TailwindCSS styling
- ✅ Dark mode support (CSS classes)
- ✅ Responsive layout (sidebar + canvas + collaborators)
- ✅ Logout functionality
- ✅ Dashboard to list and create boards

### Deployment Ready
- ✅ Dockerfiles for backend & frontend
- ✅ Environment variables configuration
- ✅ CORS properly configured
- ✅ Socket.io namespace isolation for scaling

## Project Structure

```
CollaborativeWhiteboard-/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express + Socket.io server
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Board.js
│   │   │   └── Version.js
│   │   ├── controllers/
│   │   │   └── boardController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── boards.js
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT verification
│   │   └── sockets/
│   │       └── boardSocket.js    # Room-based + role checks
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx               # Routes & auth wrapper
│   │   ├── api/
│   │   │   └── client.js         # Axios + auth interceptor
│   │   ├── store/
│   │   │   ├── useAuthStore.js   # Auth state + token
│   │   │   └── useBoardStore.js  # Board elements + cursors
│   │   ├── hooks/
│   │   │   └── useThrottledCursorMove.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Board.jsx
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── CanvasBoard.jsx
│   │   │   ├── Toolbar.jsx
│   │   │   ├── LiveCursors.jsx
│   │   │   ├── CollaboratorsList.jsx
│   │   │   ├── InviteModal.jsx
│   │   │   └── VersionHistoryModal.jsx
│   │   ├── index.css             # Tailwind
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.cjs
│   ├── postcss.config.cjs
│   ├── .env.example
│   ├── index.html
│   └── Dockerfile
│
└── README.md
```

## Getting Started (Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/whiteboard
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5173
```

Start MongoDB (if running locally):
```bash
mongod
```

Run server:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```
VITE_BACKEND_URL=http://localhost:5000
```

Run dev server:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### Test the App

1. Open http://localhost:5173
2. Register a new account
3. Create a board
4. Open board in multiple browser tabs/windows
5. Double-click canvas to add rectangles
6. Move mouse to see live cursors
7. Invite others (owner only)
8. Switch tabs to see real-time sync

## API Endpoints

### Auth
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login user

### Boards
- `POST /api/boards` — Create board (requires auth)
- `GET /api/boards/:id` — Get board details
- `POST /api/boards/:boardId/invite` — Invite collaborator (owner only)
- `POST /api/boards/:boardId/version` — Save version snapshot (owner/editor)
- `GET /api/boards/:boardId/versions` — Get version history

## Socket.io Events

All socket events are on the `/board` namespace.

### Client → Server
- `join-board` — Join board room
- `leave-board` — Leave board
- `draw-element` — Add new element (editor+ only)
- `update-element` — Update element (editor+ only)
- `delete-element` — Delete element (editor+ only)
- `cursor-move` — Emit cursor position (throttled to 60ms)
- `save-version` — Save version (owner only)

### Server → Client
- `user-joined` — User joined board
- `user-left` — User left board
- `draw-element` — Element added (broadcast)
- `update-element` — Element updated (broadcast)
- `delete-element` — Element deleted (broadcast)
- `cursor-move` — Cursor position (broadcast)
- `save-version` — Version saved (broadcast)

## Production Deployment

### Docker Build

Build backend:
```bash
cd backend
docker build -t whiteboard-backend:latest .
```

Build frontend:
```bash
cd frontend
docker build -t whiteboard-frontend:latest .
```

### Docker Compose (Optional)

Create `docker-compose.yml`:
```yaml
version: '3'
services:
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGO_URI: mongodb://mongo:27017/whiteboard
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      VITE_BACKEND_URL: ${BACKEND_URL}

volumes:
  mongo_data:
```

Run:
```bash
docker-compose up
```

### Nginx Reverse Proxy (Optional)

```nginx
upstream backend {
  server localhost:5000;
}

server {
  listen 80;
  server_name your-domain.com;

  location /api {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  location /socket.io {
    proxy_pass http://backend/socket.io;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
  }

  location / {
    root /usr/share/nginx/html;
    try_files $uri /index.html;
  }
}
```

## Scaling with Redis

For horizontal scaling (multiple server instances), integrate Redis Socket.io adapter:

1. Install Redis adapter:
   ```bash
   cd backend
   npm install @socket.io/redis-adapter redis
   ```

2. Update [backend/src/index.js](backend/src/index.js):
   ```javascript
   const { createAdapter } = require('@socket.io/redis-adapter');
   const { createClient } = require('redis');

   const pubClient = createClient({ host: 'localhost', port: 6379 });
   const subClient = pubClient.duplicate();
   
   io.adapter(createAdapter(pubClient, subClient));
   ```

3. Run Redis and start multiple backend instances behind a load balancer.

## Next Steps & TODOs

- [ ] Implement draw-on-canvas (free drawing with paths)
- [ ] Add more shape types (arrow, polygon, text with editor)
- [ ] Implement undo/redo with version control
- [ ] Add real-time drawing sync (Yjs for CRDT)
- [ ] Implement user presence UI (avatars, initials)
- [ ] Add board permissions (public/private/invite-only)
- [ ] Implement real-time collaboration features (comments, reactions)
- [ ] Add board thumbnail export
- [ ] Implement collaborative text editing in sticky notes
- [ ] Add analytics & usage tracking

## Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.io (with namespace isolation)
- JWT (jsonwebtoken)
- Bcrypt for password hashing

**Frontend:**
- React 18
- Vite (build tool)
- React Router v6 (routing)
- Zustand (state management)
- Konva.js (canvas library)
- Socket.io-client
- Axios (HTTP client)
- TailwindCSS (styling)

## License

MIT
