import express from "express";
import * as Controller from "../../controllers/type_of_group/type_of_group.controller.js";

const router = express.Router();

router.post("/", Controller.createGroupType);
router.get("/", Controller.getAllGroupTypes);

export default router;