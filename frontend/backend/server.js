import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

import vehicleRoutes from "./routes/vehicleRoutes.js";
import { sql } from "./config/db.js"; //connector to database when "sql" is called

dotenv.config(); // Load environment variables from .env file

const app = express(); //start of backend
const PORT = process.env.PORT || 3000; // Use the PORT from environment variables to localhost its good to put any setup variables in the .env file

app.use(express.json()); // built-in middleware to parse JSON bodies
app.use(cors()); // cors is a middleware that enables Cross-Origin Resource Sharing so we dont get CORS errors
app.use(helmet()); // helmet is a security middleware that helps you protect your app by setting up various HTTP headsers
app.use(morgan("dev")); // morgan is a logging middleware that logs HTTP requests and errors

//apply arjet rate limiting to all routes
app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req, {
      requested: 1, //specified that each request takes 1 token
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.status(429).json({ success: false, error: "Too many requests" });
      } else if (decision.reason.isBot()) {
        res.status(403).json({ success: false, error: "Bot access denied" });
      } else {
        res.status(403).json({ success: false, error: "Forbidden" });
      }
      return;
    }

    // check for spoofed bots (stole this straigt out of a video. Not sure about all of this arcjet syntax yet)
    if (
      decision.results.some(
        (result) => result.reason.isBot() && result.reason.isSpoofed()
      )
    ) {
      res.status(403).json({ success: false, error: "Spoofed bot detected" });
      return;
    }

    next();
  } catch (error) {
    console.error("Arcjet protection error:", error);
    next(error); //passes control to next middleware function
  }
});

app.use("/api/vehicles", vehicleRoutes); //call vehicle routes when connected endpoint

async function initDB() {
  try {
    await sql` 
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializing database:", error);
  }
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
  });
});
