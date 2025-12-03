import { sql } from "../config/db.js";

// CREATE READ UPDATE and DELETE operations (CRUD)

export const getImages = async (req, res) => {
  try {
    const { vehicle_id, vehicle_ids } = req.query;

    let images;
    if (vehicle_ids) {
      const ids = vehicle_ids
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => Number.isInteger(id));

      if (ids.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid vehicle_ids parameter" });
      }
      const idList = ids.join(", ");

      images = await sql`
        SELECT *
        FROM images
        WHERE vehicle_id IN (${sql.unsafe(idList)})
        ORDER BY vehicle_id ASC, image_id ASC
      `;
    } else if (vehicle_id) {
      images = await sql`
        SELECT * FROM images
        WHERE vehicle_id = ${vehicle_id}
        ORDER BY image_id ASC
      `;
    } else {
      images = await sql`
        SELECT * FROM images
        ORDER BY image_id ASC
      `;
    }

    res.status(200).json({ success: true, data: images });
  } catch (error) {
    console.log("Error fetching images:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getImage = async (req, res) => {
  const { id } = req.params;

  try {
    const image = await sql`
      SELECT * FROM images WHERE image_id = ${id}
    `;

    if (image.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }

    res.status(200).json({ success: true, data: image[0] });
  } catch (error) {
    console.log("Error fetching image:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createImage = async (req, res) => {
  const { vehicle_id, image_url } = req.body;

  if (!vehicle_id || !image_url) {
    return res
      .status(400)
      .json({ success: false, message: "vehicle_id and image_url are required" });
  }

  try {
    const newImage = await sql`
      INSERT INTO images (vehicle_id, image_url)
      VALUES (${vehicle_id}, ${image_url})
      RETURNING *
    `;

    res.status(201).json({ success: true, data: newImage[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid vehicle_id" });
    }
    console.log("Error creating image:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateImage = async (req, res) => {
  const { id } = req.params;
  const { vehicle_id, image_url } = req.body;

  try {
    const currentImage = await sql`
      SELECT * FROM images WHERE image_id = ${id}
    `;

    if (currentImage.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }

    const updateVehicleId = vehicle_id !== undefined ? vehicle_id : currentImage[0].vehicle_id;
    const updateImageUrl = image_url !== undefined ? image_url : currentImage[0].image_url;

    const updatedImage = await sql`
      UPDATE images
      SET 
        vehicle_id = ${updateVehicleId},
        image_url = ${updateImageUrl}
      WHERE image_id = ${id}
      RETURNING *
    `;

    res.status(200).json({ success: true, data: updatedImage[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid vehicle_id" });
    }
    console.log("Error updating image:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteImage = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedImage = await sql`
      DELETE FROM images
      WHERE image_id = ${id}
      RETURNING *
    `;

    if (deletedImage.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }

    res.status(200).json({ success: true, data: deletedImage[0] });
  } catch (error) {
    console.log("Error deleting image:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

