import React, { useEffect, useState, useRef } from "react";
import Editor from "./Editor";
import Client from "./Client";
import { useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { initSocket } from "../socket";

export default function EditorPage() {
  const socketRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
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
      socketRef.current.on("joined", ({ clients, username, socketId }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined`);
        }
      });
    };
    init();
  }, []);
  const [clients, setClient] = useState([
    { socketId: 1, username: "Summer" }, 
    { socketId: 2, username: "Rajesh" },
    { socketId: 3, username: "Harry" },
    { socketId: 4, username: "Mary" },
  ])

  if(!location.state) return <Navigate to='/' />

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
