import express from "express";
import * as Controller from "../../controllers/type_of_group/type_of_group.controller.js";

const router = express.Router();

router.get("/", Controller.getAllGroupTypes);
router.get("/:id", Controller.getGroupTypeById);

export default router;