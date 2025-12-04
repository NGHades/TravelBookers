import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { aj } from "./lib/arcjet.js"; //arcjet rate limiting middleware

import vehicleRoutes from "./routes/vehicleRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import rentalRoutes from "./routes/rentalRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import { sql } from "./config/db.js"; //connector to database when "sql" is called
import bcrypt from "bcrypt";
// import { aj } from "./lib/arcjet.js"; //import arcjet instance for rate limiting and security

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

// Register all route modules
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/comments", commentRoutes);

// Add a simple root route
app.get("/", (req, res) => {
  res.json({
    message: "TravelBookers API is running!",
    endpoints: {
      vehicles: "/api/vehicles",
      roles: "/api/roles",
      users: "/api/users",
      images: "/api/images",
      favorites: "/api/favorites",
      rentals: "/api/rentals",
      comments: "/api/comments",
    },
  });
});

async function initDB() {
  try {
    // Create Roles table first (no dependencies)
    // Using IF NOT EXISTS to preserve existing tables and data
    await sql`
      CREATE TABLE IF NOT EXISTS roles (
        role_id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL UNIQUE
      )
    `;

    // Create Users table (depends on Roles)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
      )
    `;

    // Create Vehicles table (updated schema)
    await sql`
      CREATE TABLE IF NOT EXISTS vehicles (
        vehicle_id SERIAL PRIMARY KEY,
        make VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        price_per_day DECIMAL(10, 2) NOT NULL,
        availability_status BOOLEAN DEFAULT TRUE,
        description TEXT,
        vehicle_type VARCHAR(50),
        mpg INTEGER,
        passenger_count INTEGER,
        drivetrain VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add new columns to existing vehicles table if they don't exist
    try {
      await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50)`;
      await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mpg INTEGER`;
      await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS passenger_count INTEGER`;
      await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS drivetrain VARCHAR(10)`;
    } catch (alterError) {
      // Columns might already exist, which is fine
      console.log("Note: Some columns may already exist in vehicles table");
    }

    // Create Images table (depends on Vehicles)
    await sql`
      CREATE TABLE IF NOT EXISTS images (
        image_id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
      )
    `;

    // Create Favorites table (depends on Users and Vehicles)
    await sql`
      CREATE TABLE IF NOT EXISTS favorites (
        favorite_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
        UNIQUE(user_id, vehicle_id)
      )
    `;

    // Create Rentals table (depends on Users and Vehicles)
    await sql`
      CREATE TABLE IF NOT EXISTS rentals (
        rental_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT
      )
    `;

    // Create Comments table (depends on Users and Vehicles)
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        comment_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        comment_text TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
      )
    `;

    // Seed default roles
    const existingRoles = await sql`SELECT role_id, role_name FROM roles`;
    const roleNames = existingRoles.map(r => r.role_name);
    
    if (!roleNames.includes("admin")) {
      await sql`INSERT INTO roles (role_name) VALUES ('admin') ON CONFLICT (role_name) DO NOTHING`;
      console.log("Created 'admin' role");
    }
    
    if (!roleNames.includes("customer")) {
      await sql`INSERT INTO roles (role_name) VALUES ('customer') ON CONFLICT (role_name) DO NOTHING`;
      console.log("Created 'customer' role");
    }

    // Get admin role_id
    const adminRole = await sql`SELECT role_id FROM roles WHERE role_name = 'admin'`;
    const adminRoleId = adminRole[0]?.role_id;

    // Seed default admin user (only if it doesn't exist)
    const existingAdmin = await sql`SELECT user_id FROM users WHERE email = 'admin@travelbookers.com'`;
    
    if (existingAdmin.length === 0 && adminRoleId) {
      // Default admin credentials: admin@travelbookers.com / admin123
      const defaultPassword = "admin123";
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(defaultPassword, saltRounds);
      
      await sql`
        INSERT INTO users (username, email, password_hash, role_id)
        VALUES ('admin', 'admin@travelbookers.com', ${password_hash}, ${adminRoleId})
        ON CONFLICT (email) DO NOTHING
      `;
      console.log("Created default admin user:");
      console.log("  Email: admin@travelbookers.com");
      console.log("  Password: admin123");
    } else if (existingAdmin.length > 0) {
      console.log("Admin user already exists");
    }

    console.log("Database initialized successfully - tables checked/created, existing data preserved");
  } catch (error) {
    console.error("Error initializing database:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
  }
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
  });
});

