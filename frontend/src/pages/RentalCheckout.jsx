import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/AdminDashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PENDING_RENTAL_KEY = "travelbookers_pending_rental";

function RentalCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get("status");

  const state = location.state;

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    insurance_purchased: false,
    termsAccepted: false,
  });
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const rentalContext = useMemo(() => {
    if (!state) return null;
    const {
      vehicleId,
      vehicleTitle,
      startDate,
      endDate,
      numberOfDays,
      pricePerDay,
      baseTotal,
    } = state;

    if (!vehicleId || !startDate || !endDate || !numberOfDays || !pricePerDay) {
      return null;
    }

    const baseSubtotal = Number(baseTotal || pricePerDay * numberOfDays);

    return {
      vehicleId,
      vehicleTitle,
      startDate,
      endDate,
      numberOfDays,
      pricePerDay,
      baseSubtotal,
    };
  }, [state]);

  // Handle Stripe returning to /checkout?status=success|cancel
  useEffect(() => {
    if (!status) return;

    if (status === "cancel") {
      setError("Something went wrong, please try again.");
      return;
    }

    if (status === "success") {
      const stored = localStorage.getItem(PENDING_RENTAL_KEY);
      if (!stored) {
        setError("We could not find your rental details. Please try again.");
        return;
      }

      const pending = JSON.parse(stored);

      const postRental = async () => {
        try {
          setProcessing(true);
          setError("");

          // Get the authenticated user from localStorage
          const storedUser = localStorage.getItem("user");
          let userId = null;
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              if (parsed && parsed.user_id) {
                userId = parsed.user_id;
              }
            } catch {
              userId = null;
            }
          }

          if (!userId) {
            setError("We could not identify your account. Please sign in again and retry.");
            localStorage.removeItem(PENDING_RENTAL_KEY);
            return;
          }

          const res = await fetch(`${API_BASE}/api/rentals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              vehicle_id: pending.vehicleId,
              start_date: pending.startDate,
              end_date: pending.endDate,
              status: "active",
              insurance_purchased: pending.insurance_purchased,
              first_name: pending.first_name || null,
              last_name: pending.last_name || null,
              phone: pending.phone || null,
              email: pending.email || null,
            }),
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to save rental");
          }

          const rental = data.data;

          setSuccessInfo({
            totalPaid: pending.total,
            receiptNumber: rental.rental_id,
          });

          localStorage.removeItem(PENDING_RENTAL_KEY);

          setTimeout(() => {
            navigate("/reservations");
          }, 4000);
        } catch (err) {
          console.error("Error saving rental after payment:", err);
          setError("We received your payment but could not save the rental. Please contact support.");
        } finally {
          setProcessing(false);
        }
      };

      postRental();
    }
  }, [status, navigate]);

  if (!status && !rentalContext) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>No Rental Selected</h2>
        <p>Please choose a vehicle and dates before proceeding to checkout.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rentalContext) return;

    if (!form.first_name || !form.last_name || !form.email) {
      setError("First name, last name, and email are required.");
      return;
    }

    if (!form.termsAccepted) {
      setError("You must agree to the terms and conditions to proceed.");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      // Save pending rental details locally so we can post to DB after Stripe redirect
      const insuranceFee = form.insurance_purchased ? 50 : 0;
      const subtotal = rentalContext.baseSubtotal + insuranceFee;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      const pendingRental = {
        ...form,
        vehicleId: rentalContext.vehicleId,
        vehicleTitle: rentalContext.vehicleTitle,
        startDate: rentalContext.startDate,
        endDate: rentalContext.endDate,
        numberOfDays: rentalContext.numberOfDays,
        pricePerDay: rentalContext.pricePerDay,
        insuranceFee,
        subtotal,
        tax,
        total,
      };

      localStorage.setItem(PENDING_RENTAL_KEY, JSON.stringify(pendingRental));

      const amountInCents = Math.round(total * 100);
      const origin = window.location.origin;

      const res = await fetch(`${API_BASE}/api/payments/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInCents,
          currency: "usd",
          description: pendingRental.vehicleTitle
            ? `${pendingRental.vehicleTitle} rental (${pendingRental.numberOfDays} ${
                pendingRental.numberOfDays === 1 ? "day" : "days"
              })`
            : "Vehicle rental",
          successUrl: `${origin}/checkout?status=success`,
          cancelUrl: `${origin}/checkout?status=cancel`,
          metadata: {
            vehicle_id: String(pendingRental.vehicleId),
            number_of_days: String(pendingRental.numberOfDays),
            price_per_day: String(pendingRental.pricePerDay),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.message || "Failed to start checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "There was a problem starting checkout. Please try again.");
      setProcessing(false);
    }
  };

  // If we're in the post-Stripe success flow
  if (status === "success") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        {processing && !successInfo && <p>Finalizing your rental...</p>}
        {successInfo && (
          <>
            <h2>Thank you for your payment!</h2>
            <p>Please come to the office to pick up your vehicle.</p>
            <p>
              Total paid: <strong>${successInfo.totalPaid.toFixed(2)}</strong>
            </p>
            <p>
              Receipt number: <strong>{successInfo.receiptNumber}</strong>
            </p>
            <p>You will be redirected to your reservations shortly.</p>
          </>
        )}
        {error && (
          <p style={{ color: "red", marginTop: "1rem" }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  // If we're in the post-Stripe cancel/deny flow
  if (status === "cancel") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Checkout</h2>
        <p style={{ color: "red", marginTop: "1rem" }}>Something went wrong, please try again.</p>
        <button
          type="button"
          className="primary-btn"
          style={{ marginTop: "1.5rem" }}
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Normal checkout form (before redirect to Stripe)
  const { vehicleTitle, numberOfDays, pricePerDay, baseSubtotal } = rentalContext;

  const insuranceFee = form.insurance_purchased ? 50 : 0;
  const subtotal = baseSubtotal + insuranceFee;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return (
    <div style={{ padding: "2rem" }}>
      <div className="admin-dashboard-content">
        <div className="admin-card">
          <h2>Checkout</h2>
          <p>
            You are booking: <strong>{vehicleTitle}</strong> for{" "}
            <strong>
              {numberOfDays} {numberOfDays === 1 ? "day" : "days"}
            </strong>
            .
          </p>

          <form className="admin-form" onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label htmlFor="first_name">First Name</label>
            <input
              id="first_name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="last_name">Last Name</label>
            <input
              id="last_name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="555-123-4567"
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="admin-form-field checkbox-field">
            <label htmlFor="insurance_purchased">
              Add rental insurance (optional) (+$50.00 flat)
              <input
                id="insurance_purchased"
                name="insurance_purchased"
                type="checkbox"
                checked={form.insurance_purchased}
                onChange={handleChange}
                style={{ marginLeft: "0.5rem" }}
              />
            </label>
          </div>
        </div>

        <div
          style={{
            marginTop: "1rem",
            padding: "1rem 1.25rem",
            borderRadius: "12px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "0.75rem", color: "#022d57" }}>
            Order Summary
          </h3>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.25rem",
              fontSize: "0.95rem",
            }}
          >
            <span>
              Subtotal ({numberOfDays} {numberOfDays === 1 ? "day" : "days"} @ $
              {pricePerDay.toFixed(2)}/day)
            </span>
            <span>${baseSubtotal.toFixed(2)}</span>
          </div>
          {form.insurance_purchased && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.25rem",
                fontSize: "0.95rem",
              }}
            >
              <span>Rental insurance (flat)</span>
              <span>$50.00</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.25rem",
              fontSize: "0.95rem",
            }}
          >
            <span>Sales tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "0.5rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid #e2e8f0",
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ marginTop: "1.25rem", fontSize: "0.85rem", color: "#475569" }}>
          <p>
            <strong>Insurance disclaimer:</strong> Rental insurance, if selected, provides limited
            coverage only as described in your rental agreement. It may not cover all damages,
            losses, or liabilities. You are responsible for reviewing the full terms of coverage and
            exclusions before completing your booking.
          </p>
          <p>
            <strong>Authorization & terms:</strong> By proceeding, you acknowledge that rental
            charges, taxes, fees, and any additional amounts incurred under the rental agreement may
            be charged to your selected payment method in accordance with Travel Bookers&apos;
            terms and conditions.
          </p>
          <label style={{ display: "block", marginTop: "0.5rem" }}>
            <input
              type="checkbox"
              name="termsAccepted"
              checked={form.termsAccepted}
              onChange={handleChange}
              style={{ marginRight: "0.5rem" }}
            />
            By checking here you allow Travel Bookers to process payments for this rental, store
            your booking details, and contact you regarding this reservation in accordance with our
            terms, privacy policy, and applicable law.
          </label>
        </div>

        {error && (
          <p style={{ color: "red", marginTop: "1rem" }}>
            {error}
          </p>
        )}

          <button
            type="submit"
            className="primary-btn"
            style={{ marginTop: "1.5rem" }}
            disabled={processing}
          >
            {processing ? "Redirecting to payment..." : "Continue to Payment"}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

export default RentalCheckout;


