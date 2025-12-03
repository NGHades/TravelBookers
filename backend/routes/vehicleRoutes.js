import express from "express";
import multer from "multer";
import {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicleController.js"; //import route logic from controller

const router = express.Router();

// Configure multer for memory storage (to upload directly to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }
  next();
};

router.get("/", getVehicles);
router.get("/:id", getVehicle);
router.post("/", upload.array("images", 10), handleMulterError, createVehicle); // Allow up to 10 images
router.put("/:id", upload.array("images", 10), handleMulterError, updateVehicle); // Allow up to 10 images
router.delete("/:id", deleteVehicle);

export default router;
