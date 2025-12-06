import { useEffect, useState } from "react";
import ImagePreview from "./ImagePreview";

function AddVehicleForm({ mode, initialData, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    price_per_day: "",
    availability_status: true,
    description: "",
    vehicle_type: "",
    mpg: "",
    passenger_count: "",
    drivetrain: "",
  });
  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    if (initialData) {
      setForm({
        make: initialData.make,
        model: initialData.model,
        year: initialData.year,
        price_per_day: initialData.price_per_day,
        availability_status: initialData.availability_status,
        description: initialData.description || "",
        vehicle_type: initialData.vehicle_type || "",
        mpg: initialData.mpg || "",
        passenger_count: initialData.passenger_count || "",
        drivetrain: initialData.drivetrain || "",
      });
    } else {
      setForm({
        make: "",
        model: "",
        year: "",
        price_per_day: "",
        availability_status: true,
        description: "",
        vehicle_type: "",
        mpg: "",
        passenger_count: "",
        drivetrain: "",
      });
    }
    // Reset images when form is reset or mode changes
    setSelectedImages([]);
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "availability_status"
          ? value === "true"
          : name === "year" || name === "price_per_day" || name === "mpg" || name === "passenger_count"
          ? value
          : value,
    }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedImages(files);
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      year: Number(form.year),
      price_per_day: Number(form.price_per_day),
      mpg: form.mpg ? Number(form.mpg) : null,
      passenger_count: form.passenger_count ? Number(form.passenger_count) : null,
      images: selectedImages,
    }, mode);
  };

  return (
    <form className="add-vehicle-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Make
          <input
            name="make"
            value={form.make}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Model
          <input
            name="model"
            value={form.model}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Year
          <input
            name="year"
            type="number"
            min="1950"
            max="2099"
            value={form.year}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Price per day
          <input
            name="price_per_day"
            type="number"
            min="0"
            step="0.01"
            value={form.price_per_day}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Availability
          <select
            name="availability_status"
            value={String(form.availability_status)}
            onChange={handleChange}
          >
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </label>
        <label>
          Vehicle Type
          <select
            name="vehicle_type"
            value={form.vehicle_type}
            onChange={handleChange}
          >
            <option value="">Select type</option>
            <option value="compact">Compact</option>
            <option value="car">Car</option>
            <option value="suv">SUV</option>
            <option value="truck">Truck</option>
            <option value="coupe">Coupe</option>
          </select>
        </label>
        <label>
          MPG
          <input
            name="mpg"
            type="number"
            min="0"
            value={form.mpg}
            onChange={handleChange}
            placeholder="Optional"
          />
        </label>
        <label>
          Passenger Count
          <input
            name="passenger_count"
            type="number"
            min="1"
            max="15"
            value={form.passenger_count}
            onChange={handleChange}
            placeholder="Optional"
          />
        </label>
        <label>
          Drivetrain
          <select
            name="drivetrain"
            value={form.drivetrain}
            onChange={handleChange}
          >
            <option value="">Select drivetrain</option>
            <option value="rwd">RWD</option>
            <option value="fwd">FWD</option>
            <option value="awd">AWD</option>
          </select>
        </label>
      </div>

      <label className="full-width">
        Description
        <textarea
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          placeholder="Optional - describe the vehicle"
        />
      </label>

      <label className="full-width">
        Images
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          style={{ marginBottom: "10px" }}
        />
        <ImagePreview selectedImages={selectedImages} onRemoveImage={removeImage} />
      </label>

      <div className="form-actions">
        <button
          type="button"
          className="secondary-btn"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting
            ? "Saving..."
            : mode === "edit"
            ? "Update Vehicle"
            : "Save Vehicle"}
        </button>
      </div>
    </form>
  );
}

export default AddVehicleForm;

