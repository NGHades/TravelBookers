import express from "express";
import {
  createComment,
  getComments,
  getComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

const router = express.Router();

router.get("/", getComments);
router.get("/:id", getComment);
router.post("/", createComment);
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);

export default router;

