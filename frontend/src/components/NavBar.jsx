import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/NavBar.css"; // make sure your CSS file is updated

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function NavBar({ onRequireSignIn }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load user from localStorage on mount and keep dropdown behavior
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Keep user state in sync across tabs
    const handleStorage = (event) => {
      if (event.key === "user") {
        if (event.newValue) {
          try {
            setUser(JSON.parse(event.newValue));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    const handleUserSignedIn = (event) => {
      setUser(event.detail);
    };

    const handleUserSignedOut = () => {
      setUser(null);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("userSignedIn", handleUserSignedIn);
    window.addEventListener("userSignedOut", handleUserSignedOut);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("userSignedIn", handleUserSignedIn);
      window.removeEventListener("userSignedOut", handleUserSignedOut);
    };
  }, []);

  const handleSignInClick = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleReservationsClick = (e) => {
    if (!user) {
      e.preventDefault();
      if (onRequireSignIn) {
        onRequireSignIn("Sign in to view reservations");
      }
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials");
      }

      // Check if user is admin (role_id 1 or role_name 'admin')
      if (data.data.role_id === 1 || data.data.role_name === "admin") {
        setError("Please use Admin Login for admin accounts");
        return;
      }

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(data.data));
      localStorage.setItem("isAuthenticated", "true");

      // Update local user state
      setUser(data.data);

      // Close dropdown and reset form
      setIsDropdownOpen(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    setUser(null);
    setIsDropdownOpen(false);
    window.dispatchEvent(new Event("userSignedOut"));
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="logo">
          <img src="/TravelBookersLogo.svg" alt="Travel Bookers" />
        </div>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/reservations" onClick={handleReservationsClick}>
            Reservations
          </Link>
          <Link to="/deals">Deals</Link>
          <Link to="/locations">Locations</Link>
        </nav>
        <div className="sign-in-container" ref={dropdownRef}>
          <button className="sign-in" onClick={handleSignInClick}>
            {user ? user.username || user.email : "Sign In"}
          </button>
          {isDropdownOpen && (
            <div className="sign-in-dropdown">
              {!user ? (
                <>
                  <form onSubmit={handleLoginSubmit} className="sign-in-form">
                    {error && <div className="dropdown-error">{error}</div>}
                    <div className="dropdown-form-group">
                      <label htmlFor="dropdown-email">Email</label>
                      <input
                        type="email"
                        id="dropdown-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="dropdown-form-group">
                      <label htmlFor="dropdown-password">Password</label>
                      <input
                        type="password"
                        id="dropdown-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="submit"
                      className="dropdown-login-button"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login"}
                    </button>
                    <Link
                      to="/signup"
                      className="signup-link"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      No Account? Sign Up
                    </Link>
                  </form>
                  <Link
                    to="/admin/login"
                    className="admin-login-link-dropdown"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Admin Login
                  </Link>
                </>
              ) : (
                <div className="account-dropdown">
                  <div className="account-info">
                    <div className="account-info-row">
                      <span className="account-label">Username:</span>
                      <span className="account-value">
                        {user.username || "N/A"}
                      </span>
                    </div>
                    <div className="account-info-row">
                      <span className="account-label">Email:</span>
                      <span className="account-value">{user.email}</span>
                    </div>
                  </div>
                  <div className="account-actions">
                    <button
                      type="button"
                      className="dropdown-login-button"
                      onClick={() =>
                        alert("My Favorites coming soon! (Not yet implemented)")
                      }
                    >
                      My Favorites
                    </button>
                    <button
                      type="button"
                      className="dropdown-login-button sign-out-button"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default NavBar;
