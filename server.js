import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
//import path from "path";
import { initWebSocketServer } from './websocket.js';

import financialInsuranceRoutes from './routes/financial_Insurance_form.routes.js';
import groupRiderRoutes from './routes/group_rider/group_rider.route.js'
import userRoutes from './routes/user/user_route.js'
import groupLookupRoutes from './routes/financial_insurance_group_lookups/financial_insurance_group_lookups.routes.js'
import systemLookupRoutes from './routes/financial_insurance_system_lookups/financial_insurance_system_lookups.routes.js'
import insuranceDropdownRoutes from './routes/insurance_dropdown/insurance_dropdown.routes.js'
import actuarialRoutes from './routes/actuarial_api/actuarial.routes.js';
import chatMessageRoutes from './routes/chat_message/chat_message.routes.js';

dotenv.config();
const app = express();
const server = http.createServer(app);

// Initialize Socket.io server
initWebSocketServer(server);

// app.use(cors());
// 03-24-2026 Mar; Line 16-23
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
app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // Comment out
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 1);

// Test endpoint
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello world! It's working your api" });
});

// form routes
app.use('/api/financial-insurance', financialInsuranceRoutes); 
// Group riders
app.use("/api/group-riders", groupRiderRoutes);
// User
app.use("/api/user", userRoutes)
// group lookup
app.use("/api/group-lookup", groupLookupRoutes)
// system lookup
app.use("/api/system-lookup", systemLookupRoutes)
// dropdown
app.use('/api/dropdown', insuranceDropdownRoutes);
// Actuarial API routes
app.use('/api/actuarial', actuarialRoutes);
// Chat message routes
app.use('/api/chat-messages', chatMessageRoutes);

const PORT = process.env.LOCAL_SERVER_PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
