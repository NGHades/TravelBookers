import React from "react";
import { Link } from "react-router-dom";
import "../css/NavBar.css"; // make sure your CSS file is updated

function NavBar() {
  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="logo">
          <img src="/TravelBookersLogo.svg" alt="Travel Bookers" />
        </div>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/reservations">Reservations</Link>
          <Link to="/deals">Deals</Link>
          <Link to="/locations">Locations</Link>
          <Link to="/admin/login" className="admin-login-link">Admin Login</Link>
        </nav>
        <button className="sign-in">Sign In</button>
      </div>
    </header>
  );
}

export default NavBar;
