import express from "express";
import http from "http";
import { Server } from "socket.io";
import allowedOrigins from "../config/allowed-origins.js";

export const app = express();
export const server = http.createServer(app);

// Export corsOptions for server.js
export const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
};

export const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const users = {};

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("registerUser", (userId) => {
        users[userId] = socket.id;
    });

    socket.on("sendMessage", (data) => {
        socket.emit("receiveMessage", {
            message: "Message received by server",
            data,
        });
    });

    socket.on("disconnect", () => {
        for (const userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                break;
            }
        }
    });
});
