import express from "express";
import {
  createFavorite,
  getFavorites,
  getFavorite,
  updateFavorite,
  deleteFavorite,
} from "../controllers/favoriteController.js";

const router = express.Router();

router.get("/", getFavorites);
router.get("/:id", getFavorite);
router.post("/", createFavorite);
router.put("/:id", updateFavorite);
router.delete("/:id", deleteFavorite);

export default router;

