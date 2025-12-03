import { Link, NavLink } from "react-router-dom";
import "../css/AdminNavBar.css";

function AdminNavBar() {
  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Vehicles", path: "/admin/vehicles" },
  ];

  return (
    <header className="admin-navbar">
      <div className="admin-navbar__content">
        <Link to="/admin/dashboard" className="admin-navbar__brand">
          <span className="brand-highlight">Travel</span>Bookers Admin
        </Link>

        <nav className="admin-navbar__links">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `admin-navbar__link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-navbar__actions">
          <Link to="/" className="admin-navbar__action admin-navbar__action--home">
            Back to site
          </Link>
          <button
            type="button"
            className="admin-navbar__action admin-navbar__action--logout"
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("isAuthenticated");
              window.location.href = "/admin/login";
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminNavBar;

