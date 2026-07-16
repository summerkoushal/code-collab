import { io } from 'socket.io-client'

export const initSocket = async () => {
    const option = {
      forceNew: true, // new connection should not wait to end prev Id
      reconnectionAttempts: Infinity,
      timeout: 10000,
      transports: ["websocket"],
    };
    return io(
      "https://code-collab-production-6738.up.railway.app",option,
    ); // we need to pass URL of backend on which server runs
}