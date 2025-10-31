import React from "react";
import { Link } from "react-router-dom";

function NavBar() {
  return (
    <header className="container">
      <div className="content">
        <div className="logo">
          <img src="/TravelBookersLogo.svg" alt="Travel Bookers" />
        </div>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/reservations">Reservations</Link>
          <Link to="/deals">Deals</Link>
          <Link to="/locations">Locations</Link>
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
