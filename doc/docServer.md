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