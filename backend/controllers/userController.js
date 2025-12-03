import { sql } from "../config/db.js";
import bcrypt from "bcrypt";

// CREATE READ UPDATE and DELETE operations (CRUD)

export const getUsers = async (req, res) => {
  try {
    const users = await sql`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.created_at,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      ORDER BY u.created_at DESC
    `;

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.log("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await sql`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.created_at,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ${id}
    `;

    if (user.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user[0] });
  } catch (error) {
    console.log("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createUser = async (req, res) => {
  const { username, email, password, role_id } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Username, email, and password are required",
      });
  }

  try {
    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Use provided role_id or default to 2 (assuming 1 is admin, 2 is customer)
    const finalRoleId = role_id || 2;

    const newUser = await sql`
      INSERT INTO users (username, email, password_hash, role_id)
      VALUES (${username}, ${email}, ${password_hash}, ${finalRoleId})
      RETURNING user_id, username, email, role_id, created_at
    `;

    res.status(201).json({ success: true, data: newUser[0] });
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      const field = error.constraint.includes("username") ? "username" : "email";
      return res
        .status(409)
        .json({ success: false, message: `${field} already exists` });
    }
    if (error.code === "23503") {
      // Foreign key constraint violation
      return res
        .status(400)
        .json({ success: false, message: "Invalid role_id" });
    }
    console.log("Error creating user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role_id } = req.body;

  try {
    // First, get the current user to build update query
    const currentUser = await sql`
      SELECT * FROM users WHERE user_id = ${id}
    `;

    if (currentUser.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Build update values
    const updateUsername = username !== undefined ? username : currentUser[0].username;
    const updateEmail = email !== undefined ? email : currentUser[0].email;
    const updateRoleId = role_id !== undefined ? role_id : currentUser[0].role_id;
    
    let updatePasswordHash = currentUser[0].password_hash;
    if (password !== undefined) {
      const saltRounds = 10;
      updatePasswordHash = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await sql`
      UPDATE users
      SET 
        username = ${updateUsername},
        email = ${updateEmail},
        password_hash = ${updatePasswordHash},
        role_id = ${updateRoleId}
      WHERE user_id = ${id}
      RETURNING user_id, username, email, role_id, created_at
    `;

    res.status(200).json({ success: true, data: updatedUser[0] });
  } catch (error) {
    if (error.code === "23505") {
      const field = error.constraint.includes("username") ? "username" : "email";
      return res
        .status(409)
        .json({ success: false, message: `${field} already exists` });
    }
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role_id" });
    }
    console.log("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await sql`
      DELETE FROM users
      WHERE user_id = ${id}
      RETURNING user_id, username, email, role_id, created_at
    `;

    if (deletedUser.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: deletedUser[0] });
  } catch (error) {
    console.log("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

