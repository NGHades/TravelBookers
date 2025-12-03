import { sql } from "../config/db.js";

//CREATE READ UPDATE and DELETE operations (CRUD)

export const getVehicles = async (req, res) => {
  try {
    const vehicles = await sql`
      SELECT * FROM vehicles
      ORDER BY created_at DESC
    `;

    res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    console.log("Error fetching vehicles:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createVehicle = async (req, res) => {
  const { make, model, year, price_per_day, availability_status, description } = req.body;

  if (!make || !model || !year || !price_per_day) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Make, model, year, and price_per_day are required",
      });
  }

  try {
    const newVehicle = await sql`
      INSERT INTO vehicles (make, model, year, price_per_day, availability_status, description)
      VALUES (${make}, ${model}, ${year}, ${price_per_day}, ${availability_status ?? true}, ${description ?? null})
      RETURNING *
    `;

    res.status(201).json({ success: true, data: newVehicle[0] });
  } catch (error) {
    console.log("Error creating vehicle:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await sql`
      SELECT * FROM vehicles WHERE vehicle_id = ${id}
    `;

    if (vehicle.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    res.status(200).json({ success: true, data: vehicle[0] });
  } catch (error) {
    console.log("Error fetching vehicle:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const { make, model, year, price_per_day, availability_status, description } = req.body;

  try {
    // Get current vehicle to preserve values not provided
    const currentVehicle = await sql`
      SELECT * FROM vehicles WHERE vehicle_id = ${id}
    `;

    if (currentVehicle.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    const updateMake = make !== undefined ? make : currentVehicle[0].make;
    const updateModel = model !== undefined ? model : currentVehicle[0].model;
    const updateYear = year !== undefined ? year : currentVehicle[0].year;
    const updatePricePerDay = price_per_day !== undefined ? price_per_day : currentVehicle[0].price_per_day;
    const updateAvailabilityStatus = availability_status !== undefined ? availability_status : currentVehicle[0].availability_status;
    const updateDescription = description !== undefined ? description : currentVehicle[0].description;

    const updatedVehicle = await sql`
      UPDATE vehicles
      SET 
        make = ${updateMake},
        model = ${updateModel},
        year = ${updateYear},
        price_per_day = ${updatePricePerDay},
        availability_status = ${updateAvailabilityStatus},
        description = ${updateDescription}
      WHERE vehicle_id = ${id}
      RETURNING *
    `;

    res.status(200).json({ success: true, data: updatedVehicle[0] });
  } catch (error) {
    console.log("Error updating vehicle:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedVehicle = await sql`
      DELETE FROM vehicles
      WHERE vehicle_id = ${id}
      RETURNING *
    `;

    if (deletedVehicle.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    res.status(200).json({ success: true, data: deletedVehicle[0] });
  } catch (error) {
    console.log("Error deleting vehicle:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
