function UserFilters({ searchTerm, onSearchChange, roleFilter, onRoleFilterChange, roles }) {
  return (
    <section className="admin-dashboard__controls">
      <input
        type="search"
        placeholder="Search by username or email"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <div className="admin-dashboard__filters">
        <label>
          Role
          <select value={roleFilter} onChange={(e) => onRoleFilterChange(e.target.value)}>
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

export default UserFilters;

