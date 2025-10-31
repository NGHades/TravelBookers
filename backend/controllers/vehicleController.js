import { sql } from "../config/db.js";

//CREATE READ UPDATE and DELETE operations (CRUD)

export const getVehicles = async (req, res) => {
  try {
    const vehicles = await sql`
            SELECT * FROM vehicles
            ORDER BY created_at DESC
        `;

    console.log("fetched vehicles", vehicles);
    res.status(200).json({ sucess: true, data: vehicles });
  } catch (error) {
    console.log("Error fetching vehicles:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createVehicle = async (req, res) => {
  const { name, image, price } = req.body; //works because we used express.json() middleware in server.js to parse JSON bodies
  //req.body means data in the body of the HTTP request. This is used when pushing data to DB

  if (!name || !image || !price) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const newVehicle = await sql`
            INSERT INTO vehicles (name, image, price)
            VALUES (${name}, ${image}, ${price})
            RETURNING *
        `;

    // postman free
    console.log("Created new vehicle:", newVehicle);
    res.status(201).json({ success: true, data: newVehicle[0] });
  } catch (error) {
    console.log("Error creating vehicles:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getVehicle = async (req, res) => {
  const { id } = req.params; //req.params means data in the URL parameters. This is used when getting data from DB

  try {
    const vehicle = await sql`
        SELECT * FROM vehicles WHERE id = ${id}`;

    res.status(200).json({ success: true, data: vehicle[0] });
  } catch (error) {
    console.log("Error fetching vehicle:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateVehicle = async (req, res) => {
  const { id } = req.params; //get from db
  const { name, image, price } = req.body; //push update to db

  try {
    const updatedVehicle = await sql`
            UPDATE vehicles
            SET name = ${name}, image = ${image}, price = ${price}
            WHERE id = ${id}
            RETURNING *
        `;

    if (updatedVehicle.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    res.status(200).json({ success: true, data: updatedVehicle[0] });
  } catch (error) {
    console.log("Error updating vehicle:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteVehicle = async (req, res) => {
  const { id } = req.params; //get specific id from db for vehicle to delete

  try {
    const deletedVehicle = await sql`
            DELETE FROM vehicles
            WHERE id = ${id}
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
