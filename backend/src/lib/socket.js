const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:8081',
                'http://10.0.2.2:8081',
                /^exp:\/\/.*/, // Expo development
                'https://gas-cylinder-app.onrender.com'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Driver heartbeat — keeps lastSeen fresh while online
        socket.on('heartbeat', async ({ driverId }) => {
            if (!driverId) return;
            try {
                const prisma = require('./prisma');
                await prisma.user.updateMany({
                    where: { id: driverId, isOnline: true },
                    data: { lastSeen: new Date() }
                });
            } catch (e) { /* silent */ }
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log('Client disconnected:', socket.id, 'Reason:', reason);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        console.warn('Socket.io not initialized, creating mock emitter');
        return {
            emit: (event, data) => {
                console.log('Mock emit:', event, data);
            }
        };
    }
    return io;
};

module.exports = { initSocket, getIO };
