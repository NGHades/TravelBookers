import { useEffect, useState } from "react";
import "../css/AdminDashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function AdminOverduePane() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
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

    const fetchVehicles = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/vehicles`);
        const data = await res.json();
        if (res.ok && data.success) {
          setVehicles(data.data || []);
        }
      } catch {
        // ignore vehicle fetch errors; we'll just fall back to IDs
      }
    };

    // Initial load
    fetchRentals();
    fetchVehicles();

    // Poll every 10 minutes for overdue changes
    const intervalId = setInterval(fetchRentals, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueRentals = rentals
    .filter((r) => r.status === "active")
    .filter((r) => {
      if (!r.end_date) return false;
      const end = new Date(r.end_date);
      end.setHours(0, 0, 0, 0);
      return end < today;
    })
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));

  if (loading && rentals.length === 0) {
    return (
      <section className="admin-overdue-pane admin-overdue-pane--loading">
        <p>Checking for overdue rentals...</p>
      </section>
    );
  }

  if (error && rentals.length === 0) {
    return (
      <section className="admin-overdue-pane admin-overdue-pane--error">
        <p>{error}</p>
      </section>
    );
  }

  if (overdueRentals.length === 0) {
    return null;
  }

  const daysOverdue = (endDate) => {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - end.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

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

  return (
    <section className="admin-overdue-pane">
      <div className="admin-overdue-header">
        <h2>OVERDUE RENTALS</h2>
        <p>
          These vehicles are overdue for return. Please contact customers and process returns
          promptly.
        </p>
      </div>

      <div className="admin-overdue-list">
        {overdueRentals.map((rental) => (
          <div key={rental.rental_id} className="admin-overdue-item">
            <div className="admin-overdue-main">
              <div className="admin-overdue-title">
                <span className="admin-overdue-badge">
                  {daysOverdue(rental.end_date)} day
                  {daysOverdue(rental.end_date) > 1 ? "s" : ""} overdue
                </span>
                <span className="admin-overdue-vehicle">
                  Vehicle #{rental.vehicle_id} · Rental #{rental.rental_id}
                </span>
              </div>
              <div className="admin-overdue-meta">
                <span>
                  Customer:{" "}
                  {rental.first_name || rental.last_name
                    ? `${rental.first_name || ""} ${rental.last_name || ""}`.trim()
                    : `User #${rental.user_id}`}
                </span>
                {rental.email && <span className="admin-table-subtext"> · {rental.email}</span>}
                {rental.phone && <span className="admin-table-subtext"> · {rental.phone}</span>}
              </div>
              <div className="admin-overdue-dates">
                Scheduled end date: <strong>{formatDate(rental.end_date)}</strong>
              </div>
            </div>
            <div className="admin-overdue-actions">
              <button
                type="button"
                className="admin-secondary-btn admin-overdue-email-btn"
                onClick={() => {
                  // Placeholder: will be wired to mail API later
                  console.log("Email customer clicked", {
                    rental_id: rental.rental_id,
                    email: rental.email,
                  });
                }}
              >
                Email Customer
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AdminOverduePane;


