import { formatDate } from "../../utils/dateUtils";
import { getVehicleLabel } from "../../utils/vehicleUtils";

function RentalTable({ rentals, vehicles, onCancel, onReturn, showActions = true }) {
  const getVehicleLabelForId = (vehicleId) => getVehicleLabel(vehicleId, vehicles);

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Vehicle ID</th>
            <th>Start</th>
            <th>End</th>
            {!showActions && <th>Status</th>}
            <th>Insurance</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rentals.map((rental) => (
            <tr key={rental.rental_id}>
              <td>{rental.rental_id}</td>
              <td>
                {rental.first_name || rental.last_name
                  ? `${rental.first_name || ""} ${rental.last_name || ""}`.trim()
                  : `User #${rental.user_id}`}
                <br />
                {rental.email && <span className="admin-table-subtext">{rental.email}</span>}
                {rental.phone && (
                  <span className="admin-table-subtext"> · {rental.phone}</span>
                )}
              </td>
              <td>
                {rental.vehicle_id} — {getVehicleLabelForId(rental.vehicle_id)}
              </td>
              <td>{formatDate(rental.start_date)}</td>
              <td>{formatDate(rental.end_date)}</td>
              {!showActions && <td>{rental.status}</td>}
              <td>{rental.insurance_purchased ? "Yes" : "No"}</td>
              {showActions && (
                <td>
                  <button
                    className="admin-secondary-btn"
                    onClick={() => onCancel(rental)}
                  >
                    Cancel Early
                  </button>
                  <button
                    className="admin-secondary-btn"
                    style={{ marginLeft: "0.5rem" }}
                    onClick={() => onReturn(rental)}
                  >
                    Process Return
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RentalTable;

