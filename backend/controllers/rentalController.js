import { sql } from "../config/db.js";

// CREATE READ UPDATE and DELETE operations (CRUD)

export const getRentals = async (req, res) => {
  try {
    const { user_id, vehicle_id, status } = req.query;

    let rentals;
    if (user_id && vehicle_id && status) {
      rentals = await sql`
        SELECT * FROM rentals
        WHERE user_id = ${user_id} AND vehicle_id = ${vehicle_id} AND status = ${status}
        ORDER BY rental_id DESC
      `;
    } else if (user_id && vehicle_id) {
      rentals = await sql`
        SELECT * FROM rentals
        WHERE user_id = ${user_id} AND vehicle_id = ${vehicle_id}
        ORDER BY rental_id DESC
      `;
    } else if (user_id && status) {
      rentals = await sql`
        SELECT * FROM rentals
        WHERE user_id = ${user_id} AND status = ${status}
        ORDER BY rental_id DESC
      `;
    } else if (vehicle_id && status) {
      rentals = await sql`
        SELECT * FROM rentals
        WHERE vehicle_id = ${vehicle_id} AND status = ${status}
        ORDER BY rental_id DESC
      `;
    } else if (user_id) {
      rentals = await sql`
        SELECT * FROM rentals
        WHERE user_id = ${user_id}
        ORDER BY rental_id DESC
      `;
    } else if (vehicle_id) {
      rentals = await sql`
        SELECT * FROM rentals
        WHERE vehicle_id = ${vehicle_id}
        ORDER BY rental_id DESC
      `;
    } else if (status) {
      rentals = await sql`
        SELECT * FROM rentals
        WHERE status = ${status}
        ORDER BY rental_id DESC
      `;
    } else {
      rentals = await sql`
        SELECT * FROM rentals
        ORDER BY rental_id DESC
      `;
    }

    res.status(200).json({ success: true, data: rentals });
  } catch (error) {
    console.log("Error fetching rentals:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getRental = async (req, res) => {
  const { id } = req.params;

  try {
    const rental = await sql`
      SELECT * FROM rentals WHERE rental_id = ${id}
    `;

    if (rental.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Rental not found" });
    }

    res.status(200).json({ success: true, data: rental[0] });
  } catch (error) {
    console.log("Error fetching rental:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createRental = async (req, res) => {
  const { user_id, vehicle_id, start_date, end_date, status } = req.body;

  if (!user_id || !vehicle_id || !start_date || !end_date) {
    return res
      .status(400)
      .json({
        success: false,
        message: "user_id, vehicle_id, start_date, and end_date are required",
      });
  }

  // Validate dates
  const start = new Date(start_date);
  const end = new Date(end_date);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid date format" });
  }
  if (end < start) {
    return res
      .status(400)
      .json({ success: false, message: "end_date must be after start_date" });
  }

  try {
    const newRental = await sql`
      INSERT INTO rentals (user_id, vehicle_id, start_date, end_date, status)
      VALUES (${user_id}, ${vehicle_id}, ${start_date}, ${end_date}, ${status || "active"})
      RETURNING *
    `;

    res.status(201).json({ success: true, data: newRental[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user_id or vehicle_id" });
    }
    console.log("Error creating rental:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateRental = async (req, res) => {
  const { id } = req.params;
  const { user_id, vehicle_id, start_date, end_date, status } = req.body;

  try {
    const currentRental = await sql`
      SELECT * FROM rentals WHERE rental_id = ${id}
    `;

    if (currentRental.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Rental not found" });
    }

    const updateUserId = user_id !== undefined ? user_id : currentRental[0].user_id;
    const updateVehicleId = vehicle_id !== undefined ? vehicle_id : currentRental[0].vehicle_id;
    const updateStartDate = start_date !== undefined ? start_date : currentRental[0].start_date;
    const updateEndDate = end_date !== undefined ? end_date : currentRental[0].end_date;
    const updateStatus = status !== undefined ? status : currentRental[0].status;

    // Validate dates if both are being updated
    if (start_date !== undefined || end_date !== undefined) {
      const start = new Date(updateStartDate);
      const end = new Date(updateEndDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid date format" });
      }
      if (end < start) {
        return res
          .status(400)
          .json({ success: false, message: "end_date must be after start_date" });
      }
    }

    const updatedRental = await sql`
      UPDATE rentals
      SET 
        user_id = ${updateUserId},
        vehicle_id = ${updateVehicleId},
        start_date = ${updateStartDate},
        end_date = ${updateEndDate},
        status = ${updateStatus}
      WHERE rental_id = ${id}
      RETURNING *
    `;

    res.status(200).json({ success: true, data: updatedRental[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user_id or vehicle_id" });
    }
    console.log("Error updating rental:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteRental = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRental = await sql`
      DELETE FROM rentals
      WHERE rental_id = ${id}
      RETURNING *
    `;

    if (deletedRental.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Rental not found" });
    }

    res.status(200).json({ success: true, data: deletedRental[0] });
  } catch (error) {
    console.log("Error deleting rental:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

