import { useEffect, useState } from "react";
import AdminNavBar from "../components/AdminNavBar";
import AdminOverduePane from "../components/AdminOverduePane";
import RentalForm from "../components/admin/RentalForm";
import RentalTable from "../components/admin/RentalTable";
import ReturnModal from "../components/admin/ReturnModal";
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

  const handleFormChange = (newForm) => {
    setForm(newForm);
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
    if (e && e.preventDefault) {
      e.preventDefault();
    }
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


  return (
    <div className="admin-dashboard">
      <AdminNavBar />
      <div className="admin-dashboard-content">
        <header className="admin-header">
          <h1>Admin Rentals</h1>
          <p>Manage all active and past vehicle rentals.</p>
        </header>

        <AdminOverduePane />

        <RentalForm
          form={form}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          submitting={submitting}
        />

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
                <RentalTable
                  rentals={activeRentals}
                  vehicles={vehicles}
                  onCancel={(rental) => updateRentalStatus(rental.rental_id, "cancelled")}
                  onReturn={openReturnModal}
                  showActions={true}
                />
              )}
            </section>

            <section className="admin-card">
              <h2>Past & Cancelled Rentals</h2>
              {inactiveRentals.length === 0 ? (
                <p>No past or cancelled rentals.</p>
              ) : (
                <RentalTable
                  rentals={inactiveRentals}
                  vehicles={vehicles}
                  showActions={false}
                />
              )}
            </section>
          </>
        )}

        {returnModalOpen && selectedRental && (
          <ReturnModal
            rental={selectedRental}
            returnComment={returnComment}
            onReturnCommentChange={setReturnComment}
            onConfirm={handleProcessReturn}
            onCancel={closeReturnModal}
            processing={processingReturn}
          />
        )}
      </div>
    </div>
  );
}

export default AdminRentals;


