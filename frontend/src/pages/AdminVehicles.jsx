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
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm("Delete this vehicle? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete vehicle");
      }

      await fetchVehicles();
    } catch (err) {
      setError(err.message || "Failed to delete vehicle");
    }
  };

  const handleCreateVehicle = async (formData) => {
    try {
      setSaving(true);
      setError("");
      const response = await fetch(`${API_BASE}/api/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create vehicle");
      }

      setShowAddForm(false);
      await fetchVehicles();
    } catch (err) {
      setError(err.message || "Failed to create vehicle");
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
            onClick={() => setShowAddForm((prev) => !prev)}
          >
            {showAddForm ? "Close Form" : "Add Vehicle"}
          </button>
        </header>

        {error && <div className="admin-dashboard__error">{error}</div>}

        {showAddForm && (
          <AddVehicleForm
            onSubmit={handleCreateVehicle}
            onCancel={() => setShowAddForm(false)}
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
                      {vehicle.description || "—"}
                    </td>
                    <td>
                      <button
                        className="danger-btn"
                        onClick={() => handleDeleteVehicle(vehicle.vehicle_id)}
                      >
                        Delete
                      </button>
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
      </section>
    </>
  );
}

function AddVehicleForm({ onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    price_per_day: "",
    availability_status: true,
    description: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "availability_status"
          ? value === "true"
          : name === "year" || name === "price_per_day"
          ? value
          : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      year: Number(form.year),
      price_per_day: Number(form.price_per_day),
    });
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
          {submitting ? "Saving..." : "Save Vehicle"}
        </button>
      </div>
    </form>
  );
}

export default AdminVehicles;

