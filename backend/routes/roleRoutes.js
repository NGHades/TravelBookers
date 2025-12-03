import express from "express";
import {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
} from "../controllers/roleController.js";

const router = express.Router();

router.get("/", getRoles);
router.get("/:id", getRole);
router.post("/", createRole);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

export default router;

