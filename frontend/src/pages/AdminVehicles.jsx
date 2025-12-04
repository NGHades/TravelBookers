import { useEffect, useMemo, useState } from "react";
import AdminNavBar from "../components/AdminNavBar";
import "../css/AdminDashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PAGE_SIZE = 5;

function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); // 'add' | 'edit'
  const [editableVehicle, setEditableVehicle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/api/vehicles`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch vehicles");
      }

      setVehicles(data.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const uniqueYears = useMemo(() => {
    const years = vehicles
      .map((vehicle) => vehicle.year)
      .filter((year) => Number.isInteger(year));
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        `${vehicle.make} ${vehicle.model} ${vehicle.year}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesAvailability =
        availabilityFilter === "all"
          ? true
          : availabilityFilter === "available"
          ? vehicle.availability_status
          : !vehicle.availability_status;

      const matchesYear =
        yearFilter === "all" ? true : vehicle.year === Number(yearFilter);

      return matchesSearch && matchesAvailability && matchesYear;
    });
  }, [vehicles, searchTerm, availabilityFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, page]);

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      const response = await fetch(`${API_BASE}/api/vehicles/${vehicleToDelete.vehicle_id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete vehicle");
      }

      await fetchVehicles();
      setShowDeleteModal(false);
      setVehicleToDelete(null);
    } catch (err) {
      setError(err.message || "Failed to delete vehicle");
    }
  };

  const handleCreateVehicle = async (formData, mode) => {
    try {
      setSaving(true);
      setError("");
      const endpoint =
        mode === "edit"
          ? `${API_BASE}/api/vehicles/${editableVehicle.vehicle_id}`
          : `${API_BASE}/api/vehicles`;
      const method = mode === "edit" ? "PUT" : "POST";
      
      // Check if there are images to upload
      const hasImages = formData.images && formData.images.length > 0;
      
      let body;
      let headers = {};
      
      if (hasImages) {
        // Use FormData for file uploads
        const formDataToSend = new FormData();
        formDataToSend.append("make", formData.make);
        formDataToSend.append("model", formData.model);
        formDataToSend.append("year", formData.year);
        formDataToSend.append("price_per_day", formData.price_per_day);
        formDataToSend.append("availability_status", formData.availability_status);
        if (formData.description) {
          formDataToSend.append("description", formData.description);
        }
        if (formData.vehicle_type) {
          formDataToSend.append("vehicle_type", formData.vehicle_type);
        }
        if (formData.mpg !== null && formData.mpg !== undefined && formData.mpg !== "") {
          formDataToSend.append("mpg", formData.mpg);
        }
        if (formData.passenger_count !== null && formData.passenger_count !== undefined && formData.passenger_count !== "") {
          formDataToSend.append("passenger_count", formData.passenger_count);
        }
        if (formData.drivetrain) {
          formDataToSend.append("drivetrain", formData.drivetrain);
        }
        
        // Append all images
        formData.images.forEach((image) => {
          formDataToSend.append("images", image);
        });
        
        body = formDataToSend;
        // Don't set Content-Type header - browser will set it with boundary for FormData
      } else {
        // Use JSON for regular data
        headers["Content-Type"] = "application/json";
        const { images, ...dataToSend } = formData;
        body = JSON.stringify(dataToSend);
      }
      
      const response = await fetch(endpoint, {
        method,
        headers,
        body,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save vehicle");
      }

      setShowForm(false);
      setEditableVehicle(null);
      await fetchVehicles();
    } catch (err) {
      setError(err.message || "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminNavBar />
      <section className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <h1>Vehicle Management</h1>
            <p>Manage the full TravelBookers fleet. Use search, filters, or add new vehicles.</p>
          </div>
          <button
            className="primary-btn"
            onClick={() => {
              setShowForm((prev) => !prev);
              setFormMode("add");
              setEditableVehicle(null);
            }}
          >
            {showForm ? "Close Form" : "Add Vehicle"}
          </button>
        </header>

        {error && <div className="admin-dashboard__error">{error}</div>}

        {showForm && (
          <AddVehicleForm
            mode={formMode}
            initialData={editableVehicle}
            onSubmit={handleCreateVehicle}
            onCancel={() => {
              setShowForm(false);
              setEditableVehicle(null);
            }}
            submitting={saving}
          />
        )}

        <section className="admin-dashboard__controls">
          <input
            type="search"
            placeholder="Search make, model, or year"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="admin-dashboard__filters">
            <label>
              Availability
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </label>

            <label>
              Year
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="all">All</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="admin-dashboard__table">
          {loading ? (
            <div className="admin-dashboard__state">Loading vehicles...</div>
          ) : paginatedVehicles.length === 0 ? (
            <div className="admin-dashboard__state">
              No vehicles found. Try adjusting your filters.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Year</th>
                  <th>Price / Day</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id}>
                    <td>
                      <div className="vehicle-name">
                        <span className="vehicle-make">{vehicle.make}</span>{" "}
                        <span className="vehicle-model">{vehicle.model}</span>
                      </div>
                    </td>
                    <td>{vehicle.year}</td>
                    <td>${Number(vehicle.price_per_day).toFixed(2)}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          vehicle.availability_status ? "available" : "unavailable"
                        }`}
                      >
                        {vehicle.availability_status ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="vehicle-description">
                      {vehicle.description
                        ? vehicle.description.length > 50
                          ? `${vehicle.description.slice(0, 50)}...`
                          : vehicle.description
                        : "—"}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="secondary-btn"
                          onClick={() => {
                            setEditableVehicle(vehicle);
                            setFormMode("edit");
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="danger-btn"
                          onClick={() => {
                            setVehicleToDelete(vehicle);
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="admin-dashboard__pagination">
          <button
            className="secondary-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="secondary-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </footer>
        )}
      </section>
      {showDeleteModal && (
        <ConfirmModal
          title="Delete vehicle"
          message="Are you sure you want to delete this vehicle?"
          onCancel={() => {
            setShowDeleteModal(false);
            setVehicleToDelete(null);
          }}
          onConfirm={handleDeleteVehicle}
        />
      )}
    </>
  );
}

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
        {selectedImages.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
            {selectedImages.map((file, index) => (
              <div key={index} style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
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

function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-btn" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminVehicles;

