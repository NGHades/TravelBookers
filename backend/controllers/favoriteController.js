import { sql } from "../config/db.js";

// CREATE READ UPDATE and DELETE operations (CRUD)

export const getFavorites = async (req, res) => {
  try {
    const { user_id, vehicle_id } = req.query;

    let favorites;
    if (user_id && vehicle_id) {
      favorites = await sql`
        SELECT * FROM favorites
        WHERE user_id = ${user_id} AND vehicle_id = ${vehicle_id}
      `;
    } else if (user_id) {
      favorites = await sql`
        SELECT * FROM favorites
        WHERE user_id = ${user_id}
        ORDER BY favorite_id DESC
      `;
    } else if (vehicle_id) {
      favorites = await sql`
        SELECT * FROM favorites
        WHERE vehicle_id = ${vehicle_id}
        ORDER BY favorite_id DESC
      `;
    } else {
      favorites = await sql`
        SELECT * FROM favorites
        ORDER BY favorite_id DESC
      `;
    }

    res.status(200).json({ success: true, data: favorites });
  } catch (error) {
    console.log("Error fetching favorites:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getFavorite = async (req, res) => {
  const { id } = req.params;

  try {
    const favorite = await sql`
      SELECT * FROM favorites WHERE favorite_id = ${id}
    `;

    if (favorite.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Favorite not found" });
    }

    res.status(200).json({ success: true, data: favorite[0] });
  } catch (error) {
    console.log("Error fetching favorite:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createFavorite = async (req, res) => {
  const { user_id, vehicle_id } = req.body;

  if (!user_id || !vehicle_id) {
    return res
      .status(400)
      .json({ success: false, message: "user_id and vehicle_id are required" });
  }

  try {
    const newFavorite = await sql`
      INSERT INTO favorites (user_id, vehicle_id)
      VALUES (${user_id}, ${vehicle_id})
      RETURNING *
    `;

    res.status(201).json({ success: true, data: newFavorite[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "Favorite already exists" });
    }
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user_id or vehicle_id" });
    }
    console.log("Error creating favorite:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateFavorite = async (req, res) => {
  const { id } = req.params;
  const { user_id, vehicle_id } = req.body;

  try {
    const currentFavorite = await sql`
      SELECT * FROM favorites WHERE favorite_id = ${id}
    `;

    if (currentFavorite.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Favorite not found" });
    }

    const updateUserId = user_id !== undefined ? user_id : currentFavorite[0].user_id;
    const updateVehicleId = vehicle_id !== undefined ? vehicle_id : currentFavorite[0].vehicle_id;

    const updatedFavorite = await sql`
      UPDATE favorites
      SET 
        user_id = ${updateUserId},
        vehicle_id = ${updateVehicleId}
      WHERE favorite_id = ${id}
      RETURNING *
    `;

    res.status(200).json({ success: true, data: updatedFavorite[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "Favorite already exists" });
    }
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user_id or vehicle_id" });
    }
    console.log("Error updating favorite:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteFavorite = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedFavorite = await sql`
      DELETE FROM favorites
      WHERE favorite_id = ${id}
      RETURNING *
    `;

    if (deletedFavorite.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Favorite not found" });
    }

    res.status(200).json({ success: true, data: deletedFavorite[0] });
  } catch (error) {
    console.log("Error deleting favorite:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

