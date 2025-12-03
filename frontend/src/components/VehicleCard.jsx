import { useNavigate } from "react-router-dom";
import { useState } from "react";

function VehicleCard({ vehicle, imageUrl, onRequireSignIn }) {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);

  function onFavoriteClick(e) {
    e.stopPropagation(); // Prevent card click when clicking favorite

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      if (onRequireSignIn) {
        onRequireSignIn("You must sign in before you can favorite");
      }
      return;
    }

    // Toggle local favorite state (no backend yet)
    setIsFavorited((prev) => !prev);
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
          <button
            className={`favorite-btn ${isFavorited ? "favorited" : ""}`}
            onClick={onFavoriteClick}
            aria-label={isFavorited ? "Unfavorite" : "Favorite"}
          >
            {isFavorited ? "💗" : "🤍"}
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