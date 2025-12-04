import express from "express";
import { subscribeToMailerLite } from "../controllers/mailerLiteController.js";

const router = express.Router();

// POST /api/mailerlite/subscribe
router.post("/subscribe", subscribeToMailerLite);

export default router;


