### project setup
```text
client
└── components
    ├── Client.jsx
    ├── Editor.jsx
    ├── EditorPage.jsx
    └── Home.jsx
```

```bash
npm create vite@latest # choose (ESlint), choose project name as (client)

cd client
npm i bootstrap
npm i codemirror #for our code editor
npm i react-avatar # for creating user profile avatar
npm i react-hot-toast # for user joining / leaving alert message
npm i react-router-dom # for changing between pages / routes
npm i socket.io-client # different packages are there for client / server side
npm i uuid # generates unique ID for users

# we have 2 pages (home, editor)
mkdir components
cd components
touch Home.jsx
touch EditorPage.jsx # Client.jsx and Editor.jsx are subpages of this

touch Client.jsx
touch Editor.jsx

npm run dev
```

### react-router-dom setup
```jsx
// main.jsx
import { BrowserRouter as Router } from 'react-router-dom'
  <Router>
    <App />
  </Router>,

// App.jsx
import { Route, Routes } from 'react-router-dom'
    <Routes>
      <Route path='/' element= {<Home/>} />
      <Route path='/editor/:roomId' element= { <EditorPage /> } />
    </Routes>
```

### Home page design
```jsx
// main.jsx
import 'bootstrap/dist/css/bootstrap.min.css'

// index.html
<body class="bg-black text-light">

// Home.jsx
        <div className='container-fluid'>
            <div className="row justify-content-center align-items-center min-vh-100">
                <div className="col-12 col-md-6">
                    <div className="card shadow-sm p-2 mb-5 bg-secondary rounded">
                        <div className="card-body text-center bg-dark text-light">
                            <h4>Enter the Room Id</h4>
                            <div className="form-group">
                                <input type="text" className="form-control mb-2" placeholder='Room Id' />
                            </div>
                            <div className="form-group">
                                <input type="text" className="form-control mb-2" placeholder='Username' />
                            </div>
                            <button className="btn btn-success btn-lg btn-block">JOIN</button>
                            <p className='mt-3' >don't have a room Id? <span style={{cursor: 'pointer'}} className='text-success p-2' >New Room</span> </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
```

### Editor page design

```jsx
// EditorPage.jsx
import React, { useState } from 'react'
import Editor from './Editor';
import Client from './Client';

export default function EditorPage() {
  const [clients, setClient] = useState([
    { socketId: 1, username: "Summer" }, 
    { socketId: 2, username: "Rajesh" },
    { socketId: 3, username: "Harry" },
    { socketId: 4, username: "Mary" },
  ])
  return (
    <>
      <div className="container-fluid vh-100">
        <div className="row h-100">
          <div className="col-md-2 d-flex flex-column h-100">
            <h4 className='mb-0 mt-3' >Code Collab</h4>
            <hr />
            {/* client list container  */}
            <div className="d-flex flex-column overflow-auto">
              {
                clients.map((client) => <Client key={client.socketId} username={client.username} />)
              }
            </div>
            {/* buttons */}
            <div className="mt-auto">
              <hr />
              <button className="btn btn-success">Copy Room Id</button>
              <button className="btn btn-danger mt-2 mb-2 px-3 btn-block">Leave Room</button>
            </div>
          </div>
          <div className="col-md-10 bg-secondary d-flex flex-column h-100">
            <Editor />
          </div>
        </div>
      </div>
    </>
  );
}

// Client.jsx
import React from 'react'
import Avatar from 'react-avatar'

export default function Client(props) {
  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <Avatar name={ props.username.toString() } size={50} round="14px" className='mr-3' />
        <span className='mx-2 ' >{ props.username.toString() }</span>
      </div>
    </div>
  )
}

// package.json > "codemirror": "^5.65.15", > npm init

// Editor.jsx
// learn userRef hook 
import React, { useEffect, useRef } from 'react'
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";

export default function Editor() {
    const editorRef = useRef(null);
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
            )
            editor.setSize(null, '100%');
        }
        init();
    }, [])
  return (
    <div style={{ height: "100%" }}>
      <textarea id="realTimeEditor"></textarea>
    </div>
  );
}
```

### generate roomId using UUID
```jsx
// Home.jsx
import { v4 as uuid } from "uuid";

const [roomId, setRoomId] = useState('');
const [username, setUsername] = useState('');

const generateRoomId = (e) => {
  e.preventDefault(); 
  // right click inspect, double click on img to select are some of default behaviour
  // we disable default behaviour so that our page do not render un necessarily
  const id = uuid();
  setRoomId(id);
}

  <input type="text" className="form-control mb-2" placeholder='Room Id' [value={roomId} onChange={(e) => setRoomId(e.target.value)}] />

  <p className='mt-3' >don't have a room Id? <span [onClick={generateRoomId}] style={{cursor: 'pointer'}} className='text-success p-2' >New Room</span> </p>
```

### react-hot-toast setup
```jsx
// App.jsx
import { Toaster } from "react-hot-toast"

<Toaster position='top-center' ></Toaster>

// Home.jsx
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'

  const navigate = useNavigate();

  toast.success('Room Id is generated');

const joinRoom = () => {
  if (!roomId || !username) {
    toast.error('both the fields are required');
    return;
  }
  // navigate
  navigate(`/editor/${roomId}`, {
    // we can send data to navigating destination, and use data there
    state: { username },
  })
  toast.success('room is created');
}
```