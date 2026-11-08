# 🔍 Comprehensive Code Walkthrough: Line-by-Line Guide

This guide breaks down every critical file and function in the **Code Collab** codebase. Use this to prepare for code-review questions in interviews.

---

## Table of Contents
1. [Backend: `server/index.js`](#1-backend-serverindexjs)
2. [Frontend Client Entry: `client/src/main.jsx` & `App.jsx`](#2-frontend-client-entry-clientsrcmainjsx--appjsx)
3. [WebSocket Client Factory: `client/src/socket.jsx`](#3-websocket-client-factory-clientsrcsocketjsx)
4. [Home / Join Page: `client/src/components/Home.jsx`](#4-home--join-page-clientsrccomponentshomejsx)
5. [Collaboration Hub: `client/src/components/EditorPage.jsx`](#5-collaboration-hub-clientsrccomponentseditorpagejsx)
6. [Code Editor Component: `client/src/components/Editor.jsx`](#6-code-editor-component-clientsrccomponentseditorjsx)
7. [User Avatar Component: `client/src/components/Client.jsx`](#7-user-avatar-component-clientsrccomponentsclientjsx)

---

## 1. Backend: `server/index.js`

The entire backend server is implemented cleanly in 67 lines.

```javascript
// Line 1-4: Module Imports
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
```
- **Why `http.createServer(app)` instead of `app.listen()`?**
  Express is built on top of Node's built-in `http` module. Socket.IO requires direct access to the underlying raw HTTP server instance to intercept the HTTP upgrade handshake and switch protocols from HTTP to WebSocket.
- Line 7-8 initializes the HTTP server and binds a new Socket.IO server instance `io` to it.

```javascript
// Line 10-12: Port and In-Memory Storage
const PORT = process.env.PORT || 8000;
const userSocketMap = {}; // Maps socket.id -> username
```
- `process.env.PORT`: Railway or cloud hosting dynamically provides a port in environment variables; defaults to `8000` for local dev.
- `userSocketMap`: Stores connected users. In memory, it looks like:
  ```json
  { "m351m5g89wb54WnbAAAB": "Summer" }
  ```

```javascript
// Line 14-24: Connected Clients Lookup Helper
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map( 
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      }
    }
  );
};
```
- `io.sockets.adapter.rooms.get(roomId)`: Socket.IO manages rooms as a JavaScript `Set` of socket IDs. If the room doesn't exist, return empty array `[]`.
- `Array.from(...)`: Converts the `Set` into an array so we can `.map()` over it.
- Returns an array of objects: `[{ socketId: '...', username: 'Summer' }, ...]`.

```javascript
// Line 29-45: Handling User Join
io.on("connection", (socket) => {
  socket.on('join', ({ roomId, username }) => {
    userSocketMap[socket.id] = username; // Associate socket ID with username
    socket.join(roomId);                  // Add this socket to the Socket.io room
    const clients = getAllConnectedClients(roomId);

    // Notify ALL users in the room (including the joiner) about the updated client list
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit('joined', {
        clients, 
        username, 
        socketId: socket.id,
      });
    });
  });
```
- `socket.join(roomId)`: A built-in Socket.IO utility that subscribes the socket to a room channel.
- `io.to(socketId).emit(...)`: Emits the `joined` event to each individual client in the room so they get the fresh `clients` array and know who just joined.

```javascript
// Line 46-51: Relaying Code Changes and Initial Sync
  socket.on('code-change', ({ roomId, code }) => {
    socket.in(roomId).emit('code-change', { code });
  });

  socket.on('sync-code', ({ socketId, code }) => {
    io.to(socketId).emit('code-change', { code });
  });
```
- `socket.in(roomId).emit(...)`: Broadcasts to everyone in the room **EXCEPT** the sender. (The sender already typed it, so they don't need their own message echoed back!).
- `sync-code`: When a new user arrives, an existing user sends their current code directly to the newcomer's `socketId` via `io.to(socketId)`.

```javascript
// Line 52-63: Handling Disconnection
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms]; // Copy all rooms socket was in before leaving
    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id]; // Clean up memory to prevent leaks
    socket.leave();
  });
```
- **Why `disconnecting` instead of `disconnect`?**
  In Socket.IO, `disconnecting` fires **before** the socket has left its rooms. That allows us to read `socket.rooms` and broadcast to remaining room peers. In `disconnect`, the socket has already left all rooms, so `socket.rooms` is empty!

---

## 2. Frontend Client Entry: `client/src/main.jsx` & `App.jsx`

### `main.jsx`
```jsx
createRoot(document.getElementById('root')).render(
  <Router>
    <App />
  </Router>,
);
```
- Wraps `<App />` inside `<Router>` (`BrowserRouter` from `react-router-dom`) so navigation hooks work anywhere in the application.

### `App.jsx`
```jsx
function App() {
  return (
    <>
      <Toaster position='top-center'></Toaster>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:roomId" element={<EditorPage />} />
      </Routes>
    </>
  );
}
```
- `<Toaster position="top-center" />`: Renders toast notification popups (joins, leaves, copy notifications) on top of the screen.
- Dynamic route `/editor/:roomId`: Accepts a dynamic URL parameter `roomId` (e.g., `/editor/4a5e381b-873b`).

---

## 3. WebSocket Client Factory: `client/src/socket.jsx`

```javascript
import { io } from 'socket.io-client';

export const initSocket = async () => {
    const option = {
      forceNew: true, // Forces a new socket instance rather than reusing an old one
      reconnectionAttempts: Infinity, // Keep retrying if connection drops
      timeout: 10000, // 10-second connection timeout
      transports: ["websocket"], // Skip HTTP long-polling and go directly to WebSocket
    };
    return io(
      "https://code-collab-production-6738.up.railway.app",
      option
    );
};
```
- `transports: ["websocket"]`: By default, Socket.IO tries HTTP long-polling first and upgrades to WebSockets. Specifying `["websocket"]` bypasses HTTP polling, improving connection speed and eliminating polling overhead.

---

## 4. Home / Join Page: `client/src/components/Home.jsx`

Responsible for Room creation, Room ID validation, and routing to the editor.

### Key Logic:
```javascript
const [roomId, setRoomId] = useState('');
const [username, setUsername] = useState('');
const navigate = useNavigate();

const generateRoomId = (e) => {
    e.preventDefault();
    const id = uuid(); // Generates a unique v4 UUID like '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
    setRoomId(id);
    toast.success('Room Id is generated');
};

const joinRoom = () => {
    if (!roomId || !username) {
        toast.error('both the fields are required');
        return;
    }
    // Navigate to editor page and pass username in router state
    navigate(`/editor/${roomId}`, {
        state: { username },
    });
    toast.success('room is created');
};
```
- **How data travels to the next page:**
  Notice `navigate('/editor/...', { state: { username } })`. This sends the username inside React Router's memory state without exposing it as a query parameter in the visible URL!

---

## 5. Collaboration Hub: `client/src/components/EditorPage.jsx`

This is the orchestration component coordinating the user list, socket connections, and code editor.

### Route Protection:
```javascript
const location = useLocation();
if (!location.state) return <Navigate to='/' />;
```
- If a user tries to access `/editor/12345` directly by typing it in their browser address bar without entering a username on the Home page, `location.state` will be `null`.
- `<Navigate to="/" />` instantly redirects them back to the Home page!

### Socket Initialization & Subscriptions:
```javascript
const socketRef = useRef(null);
const codeRef = useRef(null);

useEffect(() => {
  const init = async () => {
    socketRef.current = await initSocket();
    
    // 1. Error handling
    socketRef.current.on('connect_error', (err) => handleError(err));
    socketRef.current.on('connect_failed', (err) => handleError(err));

    // 2. Announce join
    socketRef.current.emit('join', {
      roomId,
      username: location.state?.username,
    });

    // 3. Listen for other users joining
    socketRef.current.on("joined", ({ clients, username, socketId }) => {
      if (username !== location.state?.username) {
        toast.success(`${username} joined`);
      }
      setClient(clients); // Update sidebar avatars list

      // Sync existing code to new joiner
      socketRef.current.emit('sync-code', {
        code: codeRef.current,
        socketId,
      });
    });

    // 4. Listen for users leaving
    socketRef.current.on("disconnected", ({ socketId, username }) => {
      toast.success(`${username} leave`); 
      setClient((prev) => prev.filter((client) => client.socketId != socketId));
    });
  };

  init();

  // 5. Cleanup on unmount
  return () => {
    socketRef.current.disconnect();
    socketRef.current.off("joined");
    socketRef.current.off("disconnected");
  };
}, []);
```
- `codeRef`: Stores the latest code string without triggering a re-render every time someone types.
- `return () => { socketRef.current.disconnect(); ... }`: Essential cleanup! Prevents zombie socket connections when navigating away.

### Clipboard API:
```javascript
const copyRoomId = async () => {
  try {
    await navigator.clipboard.writeText(roomId);
    toast.success('roomId is copied');
  } catch (error) {
    toast.error('unable to copy roomId');
  }
};
```
- Uses modern browser `navigator.clipboard.writeText()` async API to copy the Room ID with one click.

---

## 6. Code Editor Component: `client/src/components/Editor.jsx`

Mounts CodeMirror and handles two-way code synchronization.

```javascript
export default function Editor({ socketRef, roomId, onCodeChange }) {
    const editorRef = useRef(null);

    // Initial mount: instantiate CodeMirror on textarea
    useEffect(() => {
        const init = async () => {
            const editor = CodeMirror.fromTextArea(
              document.getElementById('realTimeEditor'), 
              {
                mode: { name: 'javascript', json: true }, 
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
              }
            );
            editorRef.current = editor;
            editor.setSize(null, '100%');

            // Listen to CodeMirror typing events
            editor.on('change', (instance, changes) => {
              const { origin } = changes;
              const code = instance.getValue();
              onCodeChange(code); // Update codeRef in parent component

              // Only emit if this change was typed by a human, not programmatic!
              if (origin != 'setValue') {
                socketRef.current.emit('code-change', {
                  roomId,
                  code,
                });
              }
            });
        };
        init();
    }, []);

    // Listen to incoming code updates from peers
    useEffect(() => {
      if (socketRef.current) {
        socketRef.current.on("code-change", ({ code }) => {
          if (code !== null) {
            editorRef.current.setValue(code);
          }
        });
      }
      return () => {
        socketRef.current.off('code-change');
      };
    }, [socketRef.current]);

    return (
      <div style={{ height: "100%" }}>
        <textarea id="realTimeEditor"></textarea>
      </div>
    );
}
```
- Notice the two distinct `useEffect` hooks:
  1. **Editor instantiation**: Runs once on mount (`[]`). Attaches the `editor.on('change')` handler.
  2. **Socket listener**: Dependent on `socketRef.current`. Subscribes to `'code-change'` and cleans it up with `socketRef.current.off('code-change')`.

---

## 7. User Avatar Component: `client/src/components/Client.jsx`

A clean presentational component for displaying individual connected users:

```jsx
import React from 'react';
import Avatar from 'react-avatar';

export default function Client(props) {
  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <Avatar name={props.username.toString()} size={50} round="14px" className="mr-3" />
        <span className="mx-2">{props.username.toString()}</span>
      </div>
    </div>
  );
}
```
- Uses `react-avatar` to automatically generate colorful, deterministic initials based on the user's name (e.g. "Summer" -> "S", "Alice Bob" -> "AB").

---

### Next Step
Prepare for your technical interview with **[04-INTERVIEW-QA.md](./04-INTERVIEW-QA.md)**!

