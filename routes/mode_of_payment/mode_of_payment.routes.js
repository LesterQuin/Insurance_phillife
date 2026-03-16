import express from "express";
import * as Controller from "../../controllers/mode_of_payment/mode_of_payment.controller.js"

const router = express.Router();

router.get("/", Controller.getAllPaymentModes);
router.get("/:id", Controller.getPaymentModeById);

export default router;