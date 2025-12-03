import { sql } from "../config/db.js";

// CREATE READ UPDATE and DELETE operations (CRUD)

export const getRoles = async (req, res) => {
  try {
    const roles = await sql`
      SELECT * FROM roles
      ORDER BY role_id ASC
    `;

    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    console.log("Error fetching roles:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getRole = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await sql`
      SELECT * FROM roles WHERE role_id = ${id}
    `;

    if (role.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    res.status(200).json({ success: true, data: role[0] });
  } catch (error) {
    console.log("Error fetching role:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createRole = async (req, res) => {
  const { role_name } = req.body;

  if (!role_name) {
    return res
      .status(400)
      .json({ success: false, message: "Role name is required" });
  }

  try {
    const newRole = await sql`
      INSERT INTO roles (role_name)
      VALUES (${role_name})
      RETURNING *
    `;

    res.status(201).json({ success: true, data: newRole[0] });
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      return res
        .status(409)
        .json({ success: false, message: "Role name already exists" });
    }
    console.log("Error creating role:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { role_name } = req.body;

  if (!role_name) {
    return res
      .status(400)
      .json({ success: false, message: "Role name is required" });
  }

  try {
    const updatedRole = await sql`
      UPDATE roles
      SET role_name = ${role_name}
      WHERE role_id = ${id}
      RETURNING *
    `;

    if (updatedRole.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    res.status(200).json({ success: true, data: updatedRole[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "Role name already exists" });
    }
    console.log("Error updating role:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteRole = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRole = await sql`
      DELETE FROM roles
      WHERE role_id = ${id}
      RETURNING *
    `;

    if (deletedRole.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    res.status(200).json({ success: true, data: deletedRole[0] });
  } catch (error) {
    if (error.code === "23503") {
      // Foreign key constraint violation
      return res
        .status(409)
        .json({
          success: false,
          message: "Cannot delete role: users are assigned to this role",
        });
    }
    console.log("Error deleting role:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

