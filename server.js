import express from "express";
import cors from "cors";
import dotenv from "dotenv";
//import path from "path";

import financialInsuranceRoutes from './routes/financial_Insurance_form.routes.js';
import groupClassificationRoutes from './routes/group_classification/group_Classification.routes.js'
import businessTypeRoutes from './routes/business_type/business_type.routes.js'
import groupTypeRoutes from './routes/type_of_group/type_of_group.routes.js'
import paymentModeRoutes from './routes/mode_of_payment/mode_of_payment.routes.js'
import groupPlanRoutes from './routes/group_plan/group_plan.route.js'
import groupRiderRoutes from './routes/group_rider/group_rider.route.js'
import accidentPlanRoutes from './routes/accident_plan/accident_plan.routes.js'

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
// business type
app.use("/api/business-types", businessTypeRoutes);
// Groupe type
app.use("/api/typeof-group", groupTypeRoutes);
// Type of payment
app.use("/api/payment-modes", paymentModeRoutes);
// Group plans
app.use("/api/group-plans", groupPlanRoutes);
// Group riders
app.use("/api/group-riders", groupRiderRoutes);
// Accident plans
app.use("/api/accident-plan", accidentPlanRoutes)

const PORT = process.env.LOCAL_SERVER_PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
