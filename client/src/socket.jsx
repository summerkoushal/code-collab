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