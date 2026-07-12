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
              { clients.map((client) => <Client key={client.socketId} username={client.username} />) }
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
