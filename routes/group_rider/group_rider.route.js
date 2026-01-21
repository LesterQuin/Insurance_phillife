import express from "express";
import * as Controller from "../../controllers/group_rider/group_rider.controller.js"

const router = express.Router();

router.post("/", Controller.createRider);
router.get("/", Controller.getAllRiders);

export default router;
