import VehicleCard from "./VehicleCard";

function VehicleGrid({
  vehicles,
  images,
  favoriteVehiclesSet,
  favoriteMutationId,
  onRequireSignIn,
  onToggleFavorite,
}) {
  return (
    <div className="vehicles-grid">
      {vehicles.map((vehicle) => {
        const vehicleImages = images[vehicle.vehicle_id] || [];
        const firstImage = vehicleImages.length > 0 ? vehicleImages[0].image_url : null;
        
        return (
          <VehicleCard
            vehicle={vehicle}
            imageUrl={firstImage}
            key={vehicle.vehicle_id}
            onRequireSignIn={onRequireSignIn}
            isFavorited={favoriteVehiclesSet.has(vehicle.vehicle_id)}
            onToggleFavorite={onToggleFavorite}
            favoriteBusy={favoriteMutationId === vehicle.vehicle_id}
          />
        );
      })}
    </div>
  );
}

export default VehicleGrid;

