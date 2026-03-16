import express from 'express';
import * as Controller from "../../controllers/age_profile/age_profile.controller.js";

const router = express.Router();

router.get("/", Controller.getAllAgeProfiles);
router.get("/:id", Controller.getAgeProfileById);

export default router;