import { useEffect, useMemo, useState } from "react";
import AdminNavBar from "../components/AdminNavBar";
import ConfirmModal from "../components/shared/ConfirmModal";
import Pagination from "../components/shared/Pagination";
import AddUserForm from "../components/admin/AddUserForm";
import UserTable from "../components/admin/UserTable";
import UserFilters from "../components/admin/UserFilters";
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

        <UserFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          roles={roleOptions}
        />

        <section className="admin-dashboard__table">
          {loading ? (
            <div className="admin-dashboard__state">Loading users...</div>
          ) : paginatedUsers.length === 0 ? (
            <div className="admin-dashboard__state">No users found.</div>
          ) : (
            <UserTable
              users={paginatedUsers}
              onDelete={(user) => {
                setUserToDelete(user);
                setShowDeleteModal(true);
              }}
            />
          )}
        </section>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          variant="admin"
        />
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

export default AdminUserManagement;


