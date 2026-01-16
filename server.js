import express from "express";
import cors from "cors";
import dotenv from "dotenv";
//import path from "path";

import financialInsuranceRoutes from './routes/financial_Insurance_form.routes.js';
import groupClassificationRoutes from './routes/group_Classification.routes.js'

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello world! It's working your api" });
});

// form routes
app.use('/api/financial-insurance', financialInsuranceRoutes);
// group classcifition 
app.use('/api/group-classification', groupClassificationRoutes)

const PORT = process.env.LOCAL_SERVER_PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
