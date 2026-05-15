import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io; 

/**
 * Initializes the WebSocket server and attaches it to the provided HTTP server.
 * @param {import('http').Server} server The HTTP server instance.
 */
export const initWebSocketServer = (server) => {
    if (!process.env.JWT_SECRET) {
        console.error('CRITICAL ERROR: JWT_SECRET is not defined in environment variables.');
    }

    io = new Server(server, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    // Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User ${socket.user.user_id} connected via Socket.io`);

        // Joining an application thread (Room)
        socket.on('join_application', (applicationId) => {
            const roomName = `app_${applicationId}`;
            socket.join(roomName);
            console.log(`User ${socket.user.user_id} joined room: ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
    
    console.log('Socket.io server initialized');
};

/**
 * Broadcasts a new comment to all subscribed clients for a given application ID.
 * @param {number} applicationId The ID of the application.
 * @param {object} comment The comment object to broadcast.
 */
export const broadcastComment = (applicationId, comment) => {
    if (io) {
        console.log(`Broadcasting new comment for application ${applicationId} to room app_${applicationId}`);
        io.to(`app_${applicationId}`).emit('new_comment', comment);
    }
};