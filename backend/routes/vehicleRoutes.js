import express from "express";
import {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicleController.js"; //import route logic from controller

const router = express.Router();

router.get("/", getVehicles);
router.get("/:id", getVehicle);
router.post("/", createVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

export default router;
