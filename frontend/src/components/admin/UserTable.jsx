function UserTable({ users, onDelete }) {
  return (
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
        {users.map((user) => (
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
                  onClick={() => onDelete(user)}
                >
                  Remove
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UserTable;

