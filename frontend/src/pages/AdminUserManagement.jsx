import { useEffect, useMemo, useState } from "react";
import AdminNavBar from "../components/AdminNavBar";
import "../css/AdminDashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PAGE_SIZE = 8;

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/api/users`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers(data.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/roles`);
      const data = await response.json();

      if (response.ok && data.success) {
        setRoles(data.data || []);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        `${user.username} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" ? true : Number(roleFilter) === user.role_id;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const handleCreateUser = async (formData) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add user");
      }

      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to add user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`${API_BASE}/api/users/${userToDelete.user_id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user");
      }

      await fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.message || "Failed to delete user");
    }
  };

  const roleOptions = roles.length
    ? roles
    : [
        { role_id: 1, role_name: "admin" },
        { role_id: 2, role_name: "customer" },
      ];

  return (
    <>
      <AdminNavBar />
      <section className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <h1>User Management</h1>
            <p>Invite, review, or remove admin and customer accounts.</p>
          </div>
          <button className="primary-btn" onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? "Close Form" : "Add User"}
          </button>
        </header>

        {error && <div className="admin-dashboard__error">{error}</div>}

        {showForm && (
          <AddUserForm
            roles={roleOptions}
            onSubmit={handleCreateUser}
            onCancel={() => setShowForm(false)}
            submitting={saving}
          />
        )}

        <section className="admin-dashboard__controls">
          <input
            type="search"
            placeholder="Search by username or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="admin-dashboard__filters">
            <label>
              Role
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                {roleOptions.map((role) => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="admin-dashboard__table">
          {loading ? (
            <div className="admin-dashboard__state">Loading users...</div>
          ) : paginatedUsers.length === 0 ? (
            <div className="admin-dashboard__state">No users found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role_name || (user.role_id === 1 ? "admin" : "customer")}</td>
                    <td>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="danger-btn"
                          onClick={() => {
                            setUserToDelete(user);
                            setShowDeleteModal(true);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="admin-dashboard__pagination">
          <button
            className="secondary-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="secondary-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </footer>
      </section>

      {showDeleteModal && (
        <ConfirmModal
          title="Remove user"
          message="Are you sure you want to remove this user?"
          onCancel={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteUser}
        />
      )}
    </>
  );
}

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

function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-btn" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminUserManagement;


