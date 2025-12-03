import { useNavigate } from "react-router-dom";

function VehicleCard({ vehicle, imageUrl }) {
  const navigate = useNavigate();

  function onFavoriteClick(e) {
    e.stopPropagation(); // Prevent card click when clicking favorite
    alert("favorited");
  }

  function handleCardClick() {
    navigate(`/vehicles/${vehicle.vehicle_id}`);
  }

  const defaultImage = "https://via.placeholder.com/400x300?text=No+Image";

  return (
    <div className="vehicle-card" onClick={handleCardClick}>
      <div className="vehicle-image">
        <img
          src={imageUrl || defaultImage}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        />
        <div className="vehicle-overlay">
          <button className="favorite-btn" onClick={onFavoriteClick}>
            🤍
          </button>
        </div>
      </div>

      <div className="vehicle-info">
        <h3>{`${vehicle.year} ${vehicle.make} ${vehicle.model}`}</h3>
        <p className="vehicle-price">
          ${Number(vehicle.price_per_day || 0).toFixed(2)}/day
        </p>
        {vehicle.description && (
          <p className="vehicle-description">{vehicle.description.substring(0, 100)}...</p>
        )}
      </div>
    </div>
  );
}

export default VehicleCard;