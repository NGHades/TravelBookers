import { useEffect, useMemo, useState } from "react";
import AdminNavBar from "../components/AdminNavBar";
import ConfirmModal from "../components/shared/ConfirmModal";
import Pagination from "../components/shared/Pagination";
import AddVehicleForm from "../components/admin/AddVehicleForm";
import VehicleFilters from "../components/admin/VehicleFilters";
import VehicleTable from "../components/admin/VehicleTable";
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

        <VehicleFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          availabilityFilter={availabilityFilter}
          onAvailabilityFilterChange={setAvailabilityFilter}
          yearFilter={yearFilter}
          onYearFilterChange={setYearFilter}
          uniqueYears={uniqueYears}
        />

        <section className="admin-dashboard__table">
          {loading ? (
            <div className="admin-dashboard__state">Loading vehicles...</div>
          ) : paginatedVehicles.length === 0 ? (
            <div className="admin-dashboard__state">
              No vehicles found. Try adjusting your filters.
            </div>
          ) : (
            <VehicleTable
              vehicles={paginatedVehicles}
              onEdit={(vehicle) => {
                setEditableVehicle(vehicle);
                setFormMode("edit");
                setShowForm(true);
              }}
              onDelete={(vehicle) => {
                setVehicleToDelete(vehicle);
                setShowDeleteModal(true);
              }}
            />
          )}
        </section>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
          variant="admin"
        />
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

export default AdminVehicles;

