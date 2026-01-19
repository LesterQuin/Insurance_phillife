import express from "express";
import * as Controller from "../../controllers/mode_of_payment/mode_of_payment.controller.js"

const router = express.Router();

router.post("/", Controller.createPaymentMode);
router.get("/", Controller.getAllPaymentModes);
router.get("/:id", Controller.getPaymentModeById);
router.put("/:id", Controller.updatePaymentMode);
router.delete("/:id", Controller.deletePaymentMode);

export default router;