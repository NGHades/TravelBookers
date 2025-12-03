import { sql } from "../config/db.js";

// CREATE READ UPDATE and DELETE operations (CRUD)

export const getComments = async (req, res) => {
  try {
    const { user_id, vehicle_id } = req.query;

    let comments;
    if (user_id && vehicle_id) {
      comments = await sql`
        SELECT 
          c.*,
          u.username
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.user_id = ${user_id} AND c.vehicle_id = ${vehicle_id}
        ORDER BY c.created_at DESC
      `;
    } else if (user_id) {
      comments = await sql`
        SELECT 
          c.*,
          u.username
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.user_id = ${user_id}
        ORDER BY c.created_at DESC
      `;
    } else if (vehicle_id) {
      comments = await sql`
        SELECT 
          c.*,
          u.username
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.vehicle_id = ${vehicle_id}
        ORDER BY c.created_at DESC
      `;
    } else {
      comments = await sql`
        SELECT 
          c.*,
          u.username
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.user_id
        ORDER BY c.created_at DESC
      `;
    }

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    console.log("Error fetching comments:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getComment = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await sql`
      SELECT 
        c.*,
        u.username
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE c.comment_id = ${id}
    `;

    if (comment.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    res.status(200).json({ success: true, data: comment[0] });
  } catch (error) {
    console.log("Error fetching comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createComment = async (req, res) => {
  const { user_id, vehicle_id, comment_text, rating } = req.body;

  if (!user_id || !vehicle_id || !comment_text || !rating) {
    return res
      .status(400)
      .json({
        success: false,
        message: "user_id, vehicle_id, comment_text, and rating are required",
      });
  }

  // Validate rating
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ success: false, message: "Rating must be an integer between 1 and 5" });
  }

  try {
    const newComment = await sql`
      INSERT INTO comments (user_id, vehicle_id, comment_text, rating)
      VALUES (${user_id}, ${vehicle_id}, ${comment_text}, ${rating})
      RETURNING *
    `;

    res.status(201).json({ success: true, data: newComment[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user_id or vehicle_id" });
    }
    if (error.code === "23514") {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }
    console.log("Error creating comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateComment = async (req, res) => {
  const { id } = req.params;
  const { user_id, vehicle_id, comment_text, rating } = req.body;

  try {
    const currentComment = await sql`
      SELECT * FROM comments WHERE comment_id = ${id}
    `;

    if (currentComment.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const updateUserId = user_id !== undefined ? user_id : currentComment[0].user_id;
    const updateVehicleId = vehicle_id !== undefined ? vehicle_id : currentComment[0].vehicle_id;
    const updateCommentText = comment_text !== undefined ? comment_text : currentComment[0].comment_text;
    const updateRating = rating !== undefined ? rating : currentComment[0].rating;

    // Validate rating if being updated
    if (rating !== undefined) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ success: false, message: "Rating must be an integer between 1 and 5" });
      }
    }

    const updatedComment = await sql`
      UPDATE comments
      SET 
        user_id = ${updateUserId},
        vehicle_id = ${updateVehicleId},
        comment_text = ${updateCommentText},
        rating = ${updateRating}
      WHERE comment_id = ${id}
      RETURNING *
    `;

    res.status(200).json({ success: true, data: updatedComment[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user_id or vehicle_id" });
    }
    if (error.code === "23514") {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }
    console.log("Error updating comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedComment = await sql`
      DELETE FROM comments
      WHERE comment_id = ${id}
      RETURNING *
    `;

    if (deletedComment.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    res.status(200).json({ success: true, data: deletedComment[0] });
  } catch (error) {
    console.log("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

