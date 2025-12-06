function VehicleTable({ vehicles, onEdit, onDelete }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Vehicle</th>
          <th>Year</th>
          <th>Price / Day</th>
          <th>Status</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => (
          <tr key={vehicle.vehicle_id}>
            <td>
              <div className="vehicle-name">
                <span className="vehicle-make">{vehicle.make}</span>{" "}
                <span className="vehicle-model">{vehicle.model}</span>
              </div>
            </td>
            <td>{vehicle.year}</td>
            <td>${Number(vehicle.price_per_day).toFixed(2)}</td>
            <td>
              <span
                className={`status-badge ${
                  vehicle.availability_status ? "available" : "unavailable"
                }`}
              >
                {vehicle.availability_status ? "Available" : "Unavailable"}
              </span>
            </td>
            <td className="vehicle-description">
              {vehicle.description
                ? vehicle.description.length > 50
                  ? `${vehicle.description.slice(0, 50)}...`
                  : vehicle.description
                : "—"}
            </td>
            <td>
              <div className="action-buttons">
                <button
                  className="secondary-btn"
                  onClick={() => onEdit(vehicle)}
                >
                  Edit
                </button>
                <button
                  className="danger-btn"
                  onClick={() => onDelete(vehicle)}
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default VehicleTable;

