- 01:43:31 -  socket logic to setup realtime enivironment
- 02:57:37 -  copy Room Id and Leave buttom

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
1. server side
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

2. client side
```bash
cd client/src
touch socket.jsx
```

```jsx
// socket.jsx
import { io } from 'socket.io-client'

export const initSocket = async () => {
    const option = {
        'force new connection': true, // new connection should not wait to end prev Id
        'reconnectionAttempt': 'infinity', 
        timeout: 10000,
        transports: ['websocket'],
    }
    return io(process.env.REACT_APP_BACKEND_URL, option); // we need to pass URL of backend on which server runs
}
```

```bash
cd client
touch .env
```

```js
// .env
REACT_APP_BACKEND_URL = http://localhost:5000

// EditorPage.jsx

```