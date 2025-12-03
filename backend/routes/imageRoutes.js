import express from "express";
import {
  createImage,
  getImages,
  getImage,
  updateImage,
  deleteImage,
} from "../controllers/imageController.js";

const router = express.Router();

router.get("/", getImages);
router.get("/:id", getImage);
router.post("/", createImage);
router.put("/:id", updateImage);
router.delete("/:id", deleteImage);

export default router;

