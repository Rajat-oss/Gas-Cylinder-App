import { io, Socket } from 'socket.io-client';

// Development detection
const isDevelopment = typeof __DEV__ !== 'undefined' && __DEV__;

// Socket URL configuration - same logic as API
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
let SOCKET_URL: string;

if (envApiUrl) {
    SOCKET_URL = envApiUrl;
} else if (isDevelopment) {
    SOCKET_URL = 'http://10.0.2.2:5002'; // Match backend port
} else {
    SOCKET_URL = 'https://gas-cylinder-app.onrender.com';
}

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                autoConnect: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
                timeout: 10000,
            });

            this.socket.on('connect', () => {
                console.log('Socket connected to:', SOCKET_URL);
            });

            this.socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
            });
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

    emit(event: string, data: any) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        }
    }
}

const socketService = new SocketService();
export default socketService;
