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
 * Broadcasts a deletion event to all subscribed clients in an application room.
 * @param {number} applicationId The ID of the application.
 */
export const broadcastApplicationDelete = (applicationId) => {
    if (io) {
        console.log(`Broadcasting deletion for application ${applicationId} to room app_${applicationId}`);
        io.to(`app_${applicationId}`).emit('applicationDeleted', { application_id: applicationId });
    }
};

/**
 * Broadcasts the updated comments list to all subscribed clients in an application room.
 * @param {number} applicationId The ID of the application.
 * @param {Array} comments The array of comments to broadcast.
 */
export const broadcastComment = (applicationId, comments) => {
    if (io) {
        console.log(`Broadcasting updated comments for application ${applicationId} to room app_${applicationId}`);
        io.to(`app_${applicationId}`).emit('addNewComment', comments);
    }
};

/**
 * Broadcasts the updated application data to all subscribed clients in an application room.
 * @param {number} applicationId The ID of the application.
 * @param {object} applicationData The updated application object.
 */
export const broadcastApplicationUpdate = (applicationId, applicationData) => {
    if (io) {
        console.log(`Broadcasting updated application data for ID ${applicationId} to room app_${applicationId}`);
        io.to(`app_${applicationId}`).emit('applicationUpdated', applicationData);
    }
};