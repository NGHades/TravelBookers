function RentalForm({ form, onChange, onSubmit, submitting }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <section className="admin-card">
      <h2>Add In-Person Rental</h2>
      <form className="admin-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label htmlFor="first_name">First Name</label>
            <input
              id="first_name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="Customer first name"
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="last_name">Last Name</label>
            <input
              id="last_name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="Customer last name"
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
              placeholder="customer@example.com"
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="vehicle_id">Vehicle ID</label>
            <input
              id="vehicle_id"
              name="vehicle_id"
              type="number"
              value={form.vehicle_id}
              onChange={handleChange}
              placeholder="Vehicle ID"
              required
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="start_date">Start Date</label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="end_date">End Date</label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="admin-form-field checkbox-field">
            <label htmlFor="insurance_purchased">
              Insurance purchased
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

        <button
          type="submit"
          className="admin-primary-btn"
          disabled={submitting}
        >
          {submitting ? "Adding rental..." : "Add Rental"}
        </button>
      </form>
    </section>
  );
}

export default RentalForm;

