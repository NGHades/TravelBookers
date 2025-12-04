import { useNavigate } from "react-router-dom";

function VehicleCard({
  vehicle,
  imageUrl,
  onRequireSignIn,
  isFavorited = false,
  onToggleFavorite,
  favoriteBusy = false,
}) {
  const navigate = useNavigate();

  function onFavoriteClick(e) {
    e.stopPropagation(); // Prevent card click when clicking favorite

    if (favoriteBusy) {
      return;
    }

    if (onToggleFavorite) {
      onToggleFavorite(vehicle, isFavorited, onRequireSignIn);
    }
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
            disabled={favoriteBusy}
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
        
        {/* Vehicle Specs */}
        {(vehicle.passenger_count || vehicle.mpg || vehicle.drivetrain) && (
          <div className="vehicle-specs">
            {vehicle.passenger_count && (
              <span className="spec-item">
                <span className="spec-emoji">👤</span>
                <span className="spec-text">{vehicle.passenger_count}</span>
              </span>
            )}
            {vehicle.mpg && (
              <span className="spec-item">
                <span className="spec-emoji">⏲</span>
                <span className="spec-text">{vehicle.mpg}</span>
              </span>
            )}
            {vehicle.drivetrain && (
              <span className="spec-item">
                <span className="spec-emoji">𖥞</span>
                <span className="spec-text">{vehicle.drivetrain.toUpperCase()}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VehicleCard;