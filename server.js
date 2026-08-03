import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import { notifyExpiringProposals } from './controllers/financial_Insurance_form.controller.js';

import financialInsuranceRoutes from './routes/financial_Insurance_form.routes.js';
import groupRiderRoutes from './routes/group_rider/group_rider.route.js'
import userRoutes from './routes/user/user_route.js'
import groupLookupRoutes from './routes/financial_insurance_group_lookups/financial_insurance_group_lookups.routes.js'
import systemLookupRoutes from './routes/financial_insurance_system_lookups/financial_insurance_system_lookups.routes.js'
import insuranceDropdownRoutes from './routes/insurance_dropdown/insurance_dropdown.routes.js'
import actuarialRoutes from './routes/actuarial_api/actuarial.routes.js';
import chatMessageRoutes from './routes/chat_message/chat_message.routes.js';
import installationRequirementsRoutes from './routes/requirements/installation_requirements.route.js';
import ebamRoutes from './routes/ebam_api/ebam_api.routes.js';
import { server, app, corsOptions } from './socket-io/socket_setup.js'; 

dotenv.config();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 1);

// Test endpoint
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello world! It's working your api" });
});

// Docker test endpoint
app.get("/api/docker-test", (req, res) => {
    res.json({ status: "success", message: "Docker container updated and running successfully!" });
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
// Installation requirements routes
app.use('/api/installation-requirements', installationRequirementsRoutes);
// EBAM API routes
app.use('/api/ebam', ebamRoutes);

// Schedule expiration every midnight
cron.schedule('0 0 * * *', () => {
    console.log('[Scheduler] Running scheduled daily check for expiring proposals (Asia/Manila)...');
    notifyExpiringProposals().catch(err => {
        console.error('[Scheduler] Error running scheduled expiring proposals notification task:', err);
    });
}, {
    scheduled: true,
    timezone: "Asia/Manila"
});

const PORT = process.env.PORT || 5000;
console.log(`[Startup] Attempting to listen on PORT: ${process.env.PORT} (Fallback: 5000)`);

server.on('error', (err) => {
    console.error('❌ Server listener error occurred:', err);
    if (err.stack) {
        console.error('Stack trace:', err.stack);
    }
});

try {
    server.listen(PORT, () => console.log(`✅ Server running on port/pipe ${PORT}`));
} catch (err) {
    console.error('❌ Synchronous catch during server.listen:', err);
}

// Uncomment this to checkk if the email was sending a notif immediately, this also run at startup if uncommented and comment the server.listen above

// server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//     // Startup Safeguard: Run immediate check for expiring proposals on server boot
//     console.log('[Startup] Running check for expiring proposals...');
//     notifyExpiringProposals().catch(err => {
//         console.error('[Startup] Error running startup expiring proposals check:', err);
//     });
// });