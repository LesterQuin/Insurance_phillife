import express from "express";
import * as Controller from "../../controllers/group_rider/group_rider.controller.js"

const router = express.Router();

router.get("/", Controller.getAllRiders);
router.get("/product/:productName", Controller.getRidersByProductName);
router.get("/product/GCLI", Controller.getRidersForGCLI);
router.get("/product/GYRT", Controller.getRidersForGYRT);
router.get("/product/GPA", Controller.getRidersForGPA);
router.get("/template/:acronym", Controller.viewRiderTemplateByAcronym);

export default router;
