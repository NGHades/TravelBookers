import { sql } from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

//CREATE READ UPDATE and DELETE operations (CRUD)

// Helper function to upload image to Cloudinary from buffer
const uploadImageToCloudinary = async (buffer, vehicleId, index = 0) => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: vehicleId ? `vehicles/${vehicleId}` : "vehicles/temp",
        public_id: vehicleId 
          ? `vehicle_${vehicleId}_${index}_${timestamp}` 
          : `vehicle_temp_${index}_${timestamp}`,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    // Convert buffer to stream for Cloudinary
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

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
  // Handle both JSON and form-data
  const make = req.body.make;
  const model = req.body.model;
  const year = req.body.year ? parseInt(req.body.year) : undefined;
  const price_per_day = req.body.price_per_day ? parseFloat(req.body.price_per_day) : undefined;
  const availability_status = req.body.availability_status !== undefined 
    ? req.body.availability_status === 'true' || req.body.availability_status === true
    : true;
  const description = req.body.description || null;
  const vehicle_type = req.body.vehicle_type || null;
  const mpg = req.body.mpg ? parseInt(req.body.mpg) : null;
  const passenger_count = req.body.passenger_count ? parseInt(req.body.passenger_count) : null;
  const drivetrain = req.body.drivetrain || null;
  const files = req.files || [];

  if (!make || !model || !year || !price_per_day) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Make, model, year, and price_per_day are required",
      });
  }

  try {
    // Create the vehicle first
    const newVehicle = await sql`
      INSERT INTO vehicles (make, model, year, price_per_day, availability_status, description, vehicle_type, mpg, passenger_count, drivetrain)
      VALUES (${make}, ${model}, ${year}, ${price_per_day}, ${availability_status}, ${description}, ${vehicle_type}, ${mpg}, ${passenger_count}, ${drivetrain})
      RETURNING *
    `;

    const vehicleId = newVehicle[0].vehicle_id;

    // Upload images to Cloudinary and store URLs in database
    if (files && files.length > 0) {
      const imageUploads = files.map((file, index) => 
        uploadImageToCloudinary(file.buffer, vehicleId, index)
      );

      try {
        const imageUrls = await Promise.all(imageUploads);
        
        // Store each image URL in the images table
        for (const imageUrl of imageUrls) {
          await sql`
            INSERT INTO images (vehicle_id, image_url)
            VALUES (${vehicleId}, ${imageUrl})
          `;
        }
      } catch (uploadError) {
        console.error("Error uploading images:", uploadError);
        // Continue even if image upload fails - vehicle is already created
      }
    }

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
  // Handle both JSON and form-data
  const make = req.body.make;
  const model = req.body.model;
  const year = req.body.year ? parseInt(req.body.year) : undefined;
  const price_per_day = req.body.price_per_day ? parseFloat(req.body.price_per_day) : undefined;
  const availability_status = req.body.availability_status !== undefined
    ? req.body.availability_status === 'true' || req.body.availability_status === true
    : undefined;
  const description = req.body.description;
  const vehicle_type = req.body.vehicle_type;
  const mpg = req.body.mpg !== undefined && req.body.mpg !== '' ? parseInt(req.body.mpg) : undefined;
  const passenger_count = req.body.passenger_count !== undefined && req.body.passenger_count !== '' ? parseInt(req.body.passenger_count) : undefined;
  const drivetrain = req.body.drivetrain;
  const files = req.files || [];

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
    const updateVehicleType = vehicle_type !== undefined ? vehicle_type : currentVehicle[0].vehicle_type;
    const updateMpg = mpg !== undefined ? mpg : currentVehicle[0].mpg;
    const updatePassengerCount = passenger_count !== undefined ? passenger_count : currentVehicle[0].passenger_count;
    const updateDrivetrain = drivetrain !== undefined ? drivetrain : currentVehicle[0].drivetrain;

    const updatedVehicle = await sql`
      UPDATE vehicles
      SET 
        make = ${updateMake},
        model = ${updateModel},
        year = ${updateYear},
        price_per_day = ${updatePricePerDay},
        availability_status = ${updateAvailabilityStatus},
        description = ${updateDescription},
        vehicle_type = ${updateVehicleType},
        mpg = ${updateMpg},
        passenger_count = ${updatePassengerCount},
        drivetrain = ${updateDrivetrain}
      WHERE vehicle_id = ${id}
      RETURNING *
    `;

    // Upload new images to Cloudinary and store URLs in database
    if (files && files.length > 0) {
      const vehicleId = parseInt(id);
      const imageUploads = files.map((file, index) => 
        uploadImageToCloudinary(file.buffer, vehicleId, index)
      );

      try {
        const imageUrls = await Promise.all(imageUploads);
        
        // Store each image URL in the images table
        for (const imageUrl of imageUrls) {
          await sql`
            INSERT INTO images (vehicle_id, image_url)
            VALUES (${vehicleId}, ${imageUrl})
          `;
        }
      } catch (uploadError) {
        console.error("Error uploading images:", uploadError);
        // Continue even if image upload fails - vehicle is already updated
      }
    }

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
