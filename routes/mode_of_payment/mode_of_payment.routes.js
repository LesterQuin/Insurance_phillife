import express from "express";
import * as Controller from "../../controllers/mode_of_payment/mode_of_payment.controller.js"

const router = express.Router();

router.post("/", Controller.createPaymentMode);
router.get("/", Controller.getAllPaymentModes)

export default router;