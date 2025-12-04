import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Reservations() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setError("Please sign in to view your reservations.");
      setLoading(false);
      return;
    }

    let userId = null;
    try {
      const parsed = JSON.parse(storedUser);
      userId = parsed?.user_id || null;
    } catch {
      userId = null;
    }

    if (!userId) {
      setError("We could not identify your account. Please sign in again.");
      setLoading(false);
      return;
    }

    const fetchRentals = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${API_BASE}/api/rentals?user_id=${encodeURIComponent(userId)}`
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load reservations.");
        }

        setRentals(data.data || []);
      } catch (err) {
        setError(err.message || "Something went wrong loading reservations.");
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          boxShadow: "0 15px 30px rgba(15, 23, 42, 0.08)",
          padding: "2rem 2.5rem",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "1rem",
            fontSize: "1.8rem",
            color: "#022d57",
          }}
        >
          Your Reservations
        </h2>

        {loading && <p>Loading your reservations...</p>}

        {!loading && error && (
          <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
        )}

        {!loading && !error && rentals.length === 0 && (
          <p style={{ marginTop: "0.5rem", color: "#4b5563" }}>
            You don't currently have any reservations.
          </p>
        )}

        {!loading && !error && rentals.length > 0 && (
          <div
            style={{
              marginTop: "1rem",
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "1rem",
            }}
          >
            {rentals.map((rental) => (
              <div
                key={rental.rental_id}
                style={{
                  borderRadius: "0.75rem",
                  border: "1px solid #e5e7eb",
                  padding: "1rem 1.25rem",
                  backgroundColor: "#f9fafb",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      Reservation #{rental.rental_id}
                    </div>
                    {rental.first_name && rental.last_name && (
                      <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                        {rental.first_name} {rental.last_name}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      padding: "0.15rem 0.6rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      backgroundColor:
                        rental.status === "active" ? "#dcfce7" : "#e5e7eb",
                      color:
                        rental.status === "active" ? "#166534" : "#374151",
                    }}
                  >
                    {rental.status}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1.5rem",
                    marginTop: "0.5rem",
                    fontSize: "0.9rem",
                    color: "#4b5563",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>Dates</div>
                    <div>
                      {new Date(rental.start_date).toLocaleDateString()} -{" "}
                      {new Date(rental.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Vehicle</div>
                    <div>Vehicle ID: {rental.vehicle_id}</div>
                  </div>
                  {rental.email && (
                    <div>
                      <div style={{ fontWeight: 500 }}>Contact</div>
                      <div>{rental.email}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reservations;
