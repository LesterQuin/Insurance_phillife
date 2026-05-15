import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const corsOptions = {
    origin: [
        'http://192.168.101.22:3000',
        'http://localhost:3000',
        'http://192.5.5.142:93',
        'https://192.5.5.142:95',
        'http://192.5.5.142:85'
        // 'https://www.yoursite.com'
    ],
    credentials: true,
};

const users = {};

const io = new Server(server, {
    cors: {
        origin: corsOptions.origin,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

io.on('connection', (socket) => {

    socket.on('registerUser', (userId) => {
        users[userId] = socket.id;
    });

    socket.on('sendMessage', (data) => {
        socket.emit('receiveMessage', {
            message: 'Message received by server',
            data,
        });
    });

    socket.on('disconnect', () => {
        for (const userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                break;
            }
        }
    });
});

export { app, io, server, corsOptions };