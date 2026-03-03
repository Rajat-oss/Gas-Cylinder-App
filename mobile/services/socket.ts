import { io, Socket } from 'socket.io-client';
import api from './api';

// Derive socket URL from the same base URL as API
const SOCKET_URL = api.defaults.baseURL || 'http://10.165.240.142:5000';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                autoConnect: true,
                reconnectionAttempts: 10,
                timeout: 5000,
            });

            this.socket.on('connect', () => { });

            this.socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
            });

            this.socket.on('disconnect', (reason) => { });
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string, callback?: (data: any) => void) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

const socketService = new SocketService();
export default socketService;
