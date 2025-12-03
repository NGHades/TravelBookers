import { useState } from "react";
import "../css/SignInModal.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function SignInModal({ isOpen, onClose, message }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("signin-modal-overlay")) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
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

      // Block admins from logging in via customer modal
      if (data.data.role_id === 1 || data.data.role_name === "admin") {
        setError("Please use Admin Login for admin accounts");
        return;
      }

      // Persist user and auth state
      localStorage.setItem("user", JSON.stringify(data.data));
      localStorage.setItem("isAuthenticated", "true");

      // Notify rest of app (e.g., NavBar) that a user signed in
      window.dispatchEvent(
        new CustomEvent("userSignedIn", { detail: data.data })
      );

      // Reset and close
      setEmail("");
      setPassword("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="signin-modal-overlay"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="signin-modal">
        <button className="signin-modal-close" onClick={onClose}>
          ✕
        </button>
        <h2 className="signin-modal-title">
          {message || "Sign in to continue"}
        </h2>

        <form onSubmit={handleSubmit} className="signin-modal-form">
          {error && <div className="signin-modal-error">{error}</div>}

          <div className="signin-modal-group">
            <label htmlFor="modal-email">Email</label>
            <input
              type="email"
              id="modal-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="signin-modal-group">
            <label htmlFor="modal-password">Password</label>
            <input
              type="password"
              id="modal-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="signin-modal-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignInModal;


