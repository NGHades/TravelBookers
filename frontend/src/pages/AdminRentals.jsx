import { useEffect, useState } from "react";
import AdminNavBar from "../components/AdminNavBar";
import AdminOverduePane from "../components/AdminOverduePane";
import "../css/AdminDashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function AdminRentals() {
  const [rentals, setRentals] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    vehicle_id: "",
    start_date: "",
    end_date: "",
    insurance_purchased: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [selectedRental, setSelectedRental] = useState(null);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/rentals`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load rentals");
      }
      setRentals(data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load rentals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/vehicles`);
        const data = await res.json();
        if (res.ok && data.success) {
          setVehicles(data.data || []);
        }
      } catch {
        // ignore vehicle errors here; table will just fall back to ID
      }
    };

    fetchRentals();
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // For now, require a vehicle_id and dates; the backend expects a user_id,
      // but for in-person rentals you might attach this to a generic walk-in user
      // or extend the backend later to store these contact fields directly.
      const payload = {
        user_id: 1, // placeholder admin/walk-in user
        vehicle_id: Number(form.vehicle_id),
        start_date: form.start_date,
        end_date: form.end_date,
        status: "active",
        insurance_purchased: form.insurance_purchased,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        phone: form.phone || null,
        email: form.email || null,
      };

      const res = await fetch(`${API_BASE}/api/rentals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create rental");
      }

      setForm({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        vehicle_id: "",
        start_date: "",
        end_date: "",
        insurance_purchased: false,
      });

      fetchRentals();
    } catch (err) {
      setError(err.message || "Failed to create rental");
    } finally {
      setSubmitting(false);
    }
  };

  const updateRentalStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/rentals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update rental");
      }
      fetchRentals();
    } catch (err) {
      setError(err.message || "Failed to update rental");
    }
  };

  const openReturnModal = (rental) => {
    setSelectedRental(rental);
    setReturnComment(rental.return_comment || "");
    setReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    setSelectedRental(null);
    setReturnComment("");
    setReturnModalOpen(false);
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!selectedRental) return;
    try {
      setProcessingReturn(true);
      const res = await fetch(`${API_BASE}/api/rentals/${selectedRental.rental_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "returned",
          return_comment: returnComment || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process return");
      }
      await fetchRentals();
      closeReturnModal();
    } catch (err) {
      setError(err.message || "Failed to process return");
    } finally {
      setProcessingReturn(false);
    }
  };

  const activeRentals = rentals.filter((r) => r.status === "active");
  const inactiveRentals = rentals.filter((r) => r.status !== "active");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getVehicleLabel = (vehicleId) => {
    const vehicle = vehicles.find((v) => v.vehicle_id === vehicleId);
    if (!vehicle) return `Vehicle #${vehicleId}`;
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  return (
    <div className="admin-dashboard">
      <AdminNavBar />
      <div className="admin-dashboard-content">
        <header className="admin-header">
          <h1>Admin Rentals</h1>
          <p>Manage all active and past vehicle rentals.</p>
        </header>

        <AdminOverduePane />

        <section className="admin-card">
          <h2>Add In-Person Rental</h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label htmlFor="first_name">First Name</label>
                <input
                  id="first_name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Customer first name"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="last_name">Last Name</label>
                <input
                  id="last_name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Customer last name"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="555-123-4567"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="customer@example.com"
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="vehicle_id">Vehicle ID</label>
                <input
                  id="vehicle_id"
                  name="vehicle_id"
                  type="number"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  placeholder="Vehicle ID"
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="start_date">Start Date</label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="end_date">End Date</label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="admin-form-field checkbox-field">
                <label htmlFor="insurance_purchased">
                  Insurance purchased
                  <input
                    id="insurance_purchased"
                    name="insurance_purchased"
                    type="checkbox"
                    checked={form.insurance_purchased}
                    onChange={handleChange}
                    style={{ marginLeft: "0.5rem" }}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="admin-primary-btn"
              disabled={submitting}
            >
              {submitting ? "Adding rental..." : "Add Rental"}
            </button>
          </form>
        </section>

        {error && <div className="admin-error-banner">{error}</div>}

        {loading ? (
          <div className="admin-card">
            <p>Loading rentals...</p>
          </div>
        ) : (
          <>
            <section className="admin-card">
              <h2>Active Rentals</h2>
              {activeRentals.length === 0 ? (
                <p>No active rentals.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Vehicle ID</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Insurance</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRentals.map((rental) => (
                        <tr key={rental.rental_id}>
                          <td>{rental.rental_id}</td>
                          <td>
                            {rental.first_name || rental.last_name
                              ? `${rental.first_name || ""} ${rental.last_name || ""}`.trim()
                              : `User #${rental.user_id}`}
                            <br />
                            {rental.email && <span className="admin-table-subtext">{rental.email}</span>}
                            {rental.phone && (
                              <span className="admin-table-subtext"> · {rental.phone}</span>
                            )}
                          </td>
                          <td>
                            {rental.vehicle_id} — {getVehicleLabel(rental.vehicle_id)}
                          </td>
                          <td>{formatDate(rental.start_date)}</td>
                          <td>{formatDate(rental.end_date)}</td>
                          <td>{rental.insurance_purchased ? "Yes" : "No"}</td>
                          <td>
                            <button
                              className="admin-secondary-btn"
                              onClick={() =>
                                updateRentalStatus(rental.rental_id, "cancelled")
                              }
                            >
                              Cancel Early
                            </button>
                            <button
                              className="admin-secondary-btn"
                              style={{ marginLeft: "0.5rem" }}
                              onClick={() => openReturnModal(rental)}
                            >
                              Process Return
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="admin-card">
              <h2>Past & Cancelled Rentals</h2>
              {inactiveRentals.length === 0 ? (
                <p>No past or cancelled rentals.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Vehicle ID</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                        <th>Insurance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inactiveRentals.map((rental) => (
                        <tr key={rental.rental_id}>
                          <td>{rental.rental_id}</td>
                          <td>
                            {rental.first_name || rental.last_name
                              ? `${rental.first_name || ""} ${rental.last_name || ""}`.trim()
                              : `User #${rental.user_id}`}
                            <br />
                            {rental.email && <span className="admin-table-subtext">{rental.email}</span>}
                            {rental.phone && (
                              <span className="admin-table-subtext"> · {rental.phone}</span>
                            )}
                          </td>
                          <td>
                            {rental.vehicle_id} — {getVehicleLabel(rental.vehicle_id)}
                          </td>
                          <td>{formatDate(rental.start_date)}</td>
                          <td>{formatDate(rental.end_date)}</td>
                          <td>{rental.status}</td>
                          <td>{rental.insurance_purchased ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {returnModalOpen && selectedRental && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Process Vehicle Return</h3>
              <p>
                Mark rental #{selectedRental.rental_id} for vehicle #{selectedRental.vehicle_id} as
                returned. You can add a return note below (condition, fuel level, etc.).
              </p>
              <form onSubmit={handleProcessReturn} className="admin-form">
                <div className="admin-form-field">
                  <label htmlFor="return_comment">Return Comment</label>
                  <textarea
                    id="return_comment"
                    rows={4}
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                    placeholder="Optional: note vehicle condition, mileage, fuel level, etc."
                  />
                </div>
                <div className="form-actions" style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={closeReturnModal}
                    disabled={processingReturn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={processingReturn}
                  >
                    {processingReturn ? "Processing..." : "Mark as Returned"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRentals;


