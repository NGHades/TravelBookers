import { Link } from "react-router-dom";
import AdminNavBar from "../components/AdminNavBar";
import "../css/AdminDashboard.css";

function AdminDashboard() {
  return (
    <>
      <AdminNavBar />
      <section className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome to the TravelBookers admin panel. Manage your fleet and operations.</p>
          </div>
        </header>

        <div className="admin-dashboard__cards">
          <Link to="/admin/vehicles" className="admin-dashboard__card">
            <div className="card-icon">🚗</div>
            <h2>Vehicles</h2>
            <p>Manage your vehicle fleet, add new vehicles, update availability, and more.</p>
          </Link>

          <div className="admin-dashboard__card admin-dashboard__card--coming-soon">
            <div className="card-icon">📋</div>
            <h2>Rentals</h2>
            <p>View and manage vehicle rentals. Coming soon.</p>
          </div>

          <div className="admin-dashboard__card admin-dashboard__card--coming-soon">
            <div className="card-icon">👥</div>
            <h2>Users</h2>
            <p>Manage user accounts and permissions. Coming soon.</p>
          </div>

          <div className="admin-dashboard__card admin-dashboard__card--coming-soon">
            <div className="card-icon">💬</div>
            <h2>Comments</h2>
            <p>Review and moderate user comments. Coming soon.</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default AdminDashboard;
