import { useEffect, useState } from "react";

function AddUserForm({ roles, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role_id: roles[0]?.role_id || 2,
  });

  useEffect(() => {
    if (!roles.length) return;
    setForm((prev) => {
      if (roles.some((role) => role.role_id === Number(prev.role_id))) {
        return prev;
      }
      return { ...prev, role_id: roles[0].role_id };
    });
  }, [roles]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      username: form.username,
      email: form.email,
      password: form.password,
      role_id: Number(form.role_id),
    });
  };

  return (
    <form className="add-vehicle-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Username
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            placeholder="jane.doe"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="jane@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
        </label>
        <label>
          Role
          <select name="role_id" value={form.role_id} onChange={handleChange}>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? "Saving..." : "Create User"}
        </button>
      </div>
    </form>
  );
}

export default AddUserForm;

