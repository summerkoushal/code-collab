### Server
```bash
mkdir server
cd server
npm init -y
npm i express 
npm i socket.io
npm i nodemon

touch index.js
npm run dev
```

### Socket.io connection server and client side
- server side
```jsx
// package.json
"start": "nodemon index.js",

// index.js
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");


const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8000;

io.on("connection", (Socket) => {
  console.log(`user connected: ${socket.id}`);
});

server.listen(PORT, () => {
  console.log("server is running");
});
```

- client side
```bash
cd client/src
touch socket.jsx
```

```jsx
// socket.jsx
import { io } from 'socket.io-client'

export const initSocket = async () => {
    const option = {
      forceNew: true, // new connection should not wait to end prev Id
      reconnectionAttempts: Infinity,
      timeout: 10000,
      transports: ["websocket"],
    };
    return io('http://localhost:8000', option); // we need to pass URL of backend on which server runs
}
```

```jsx
// EditorPage.jsx
import { useLocation, useParams } from "react-router-dom";
import { initSocket } from "../socket";

  const socketRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      // socketRef.current.emit('join', {
      //   roomId,
      //   username: location.state?.username,
      // })
    };
    init();
  }, []);
```

```text
Steps to run : 
1. go to server and run: $npm start
2. go to client and run: $npm run dev
3. now socketId will be shown in terminal if user connects
```

### socket logic to setup realtime enivironment
```jsx
// EditorPage.jsx
import { useNavigate, Navigate } from "react-router-dom";

  const navigate = useNavigate();

  socketRef.current.on('connect_error', (err) => handleError(err));
  socketRef.current.on('connect_failed', (err) => handleError(err));

  const handleError = (e) => {
    console.log('socket error=>', e);
    toast.error('Socket connection failed');
    navigate('/');
  }
  socketRef.current.emit('join', {
    roomId,
    username: location.state?.username,
  })

  if(!location.state) return <Navigate to='/' />
```
- after runing this : it prints this in terminal : socketId: 'm351m5g89wb54WnbAAAB', username: 'summer'

```jsx
// server > index.js
const userSocketMap = {}; // syntax : {socketid: username}

const getAllConnectedClients = (roomId) => {
  // returns map, therefor casting
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map( 
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      }
    }
  ) 
}

io.on("connection", (socket) => {
  // console.log(`user connected: ${socket.id}`);

  socket.on('join', ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    // console.log(clients);
    // notify to all user that new user are joined
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit('joined', {
        clients, 
        username, 
        socketId: socket.id,
      })
    })
  });
});

// EditorPage.jsx
socketRef.current.on("joined", ({ clients, username, socketId }) => {
  if (username !== location.state?.username) {
    toast.success(`${username} joined`);
  }
  setClient(clients);
});
// NOTE : after this all users will get in a group and all will get notification if someone joined, except self
```

### left users name disappear without clicking refresh if they left

```jsx
// index.js
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
// EditorPage.jsx
      // disconnected
      socketRef.current.on("disconnected", ({ socketId, username }) => {
        // console.log(socketId, username);
        toast.success(`${username} leave`); 
        setClient((prev) => {
          return prev.filter((client) => client.socketId != socketId);
        });
      });

  return () => {
    socketRef.current.disconnect();
  //   socketRef.current.off("joined");
  //   socketRef.current.off("disconnected");
  };

// Editor.jsx
    [editorRef.current =] document.getElementById('realTimeEditor'),
```

### code is sync among users, but newly joined people dont get prev code

```jsx
// index.js
  socket.on('code-change', ({ roomId, code }) => {
    socket.in(roomId).emit('code-change', { code });
  })
  // socket.on('sync-code', ({ socketId, code }) => {
  //   io.to(socketId).emit('sync-code', { code });
  // })

// EditorPage.jsx
    socketRef.current.off("joined");
    socketRef.current.off("disconnected");

    <Editor socketRef={socketRef} roomId={roomId} />

// Editor.jsx
export default function Editor({ socketRef, roomId }) {

  const editor = CodeMirror.fromTextArea(document.getElementById('realTimeEditor'), {

          editorRef.current = editor;
            editor.setSize(null, '100%');
          editor.on('change', (instance, changes) => {
            // console.log(`changes`, instance, changes);
            const { origin } = changes;
            const code = instance.getValue();
            if (origin != 'setValue') {
              socketRef.current.emit('code-change', {
                roomId,
                code,
              });
            }
          })

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
    }
  }, [socketRef.current])
```

### code is sync among users, and newly joined people get prev code

```jsx
// index.js
  socket.on('sync-code', ({ socketId, code }) => {
    io.to(socketId).emit('code-change', { code });
  })

// Editor.jsx
export default function Editor({ socketRef, roomId, onCodeChange }) {

  onCodeChange(code);

// EditorPage.jsx
  const codeRef = useRef(null);

        socketRef.current.emit('sync-code', {
          code: codeRef.current,
          socketId,
        });
      });

  <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) => (codeRef.current = code)} />
```