import express from "express";
import * as Controller from "../../controllers/type_of_group/type_of_group.controller.js";

const router = express.Router();

router.post("/", Controller.createGroupType);
router.get("/", Controller.getAllGroupTypes);
router.get("/:id", Controller.getGroupTypeById);
router.put("/:id", Controller.updateGroupType);
router.delete("/:id", Controller.deleteGroupType);

export default router;