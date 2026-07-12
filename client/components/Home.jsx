import React, { useState } from 'react'
import { v4 as uuid } from "uuid";

export default function Home() {
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const generateRoomId = (e) => {
        e.preventDefault(); // right click inspect, double click on img to select are some of default behaviour
        // we disable default behaviour so that our page do not render un necessarily
        const id = uuid();
        setRoomId(id);
    }

    return (
        <div className='container-fluid'>
            <div className="row justify-content-center align-items-center min-vh-100">
                <div className="col-12 col-md-6">
                    <div className="card shadow-sm p-2 mb-5 bg-secondary rounded">
                        <div className="card-body text-center bg-dark text-light">
                            <h4>Enter the Room Id</h4>
                            <div className="form-group">
                                <input type="text" className="form-control mb-2" placeholder='Room Id' value={roomId} onChange={(e) => setRoomId(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <input type="text" className="form-control mb-2" placeholder='Username' />
                            </div>
                            <button className="btn btn-success btn-lg btn-block">JOIN</button>
                            <p className='mt-3' >don't have a room Id? <span onClick={generateRoomId} style={{cursor: 'pointer'}} className='text-success p-2' >New Room</span> </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
