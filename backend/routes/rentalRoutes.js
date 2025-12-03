import express from "express";
import {
  createRental,
  getRentals,
  getRental,
  updateRental,
  deleteRental,
} from "../controllers/rentalController.js";

const router = express.Router();

router.get("/", getRentals);
router.get("/:id", getRental);
router.post("/", createRental);
router.put("/:id", updateRental);
router.delete("/:id", deleteRental);

export default router;

