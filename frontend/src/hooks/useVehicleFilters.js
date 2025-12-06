import { useMemo } from "react";

export function useVehicleFilters({
  vehicles,
  searchQuery,
  vehicleTypeFilter,
  maxPrice,
  passengerFilter,
  sortBy,
  favoritesOnly,
  favoriteVehiclesSet,
}) {
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles.filter((vehicle) => {
      // Search filter
      const searchTerm = searchQuery.toLowerCase();
      const vehicleString = `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase();
      if (!vehicleString.includes(searchTerm) || !vehicle.availability_status) {
        return false;
      }

      // Vehicle type filter
      if (vehicleTypeFilter !== "any" && vehicle.vehicle_type !== vehicleTypeFilter) {
        return false;
      }

      // Price filter
      const price = Number(vehicle.price_per_day || 0);
      if (price > maxPrice) {
        return false;
      }

      // Passenger filter
      if (passengerFilter !== "any") {
        const passengerCount = vehicle.passenger_count || 0;
        const minPassengers = parseInt(passengerFilter.replace("+", ""));
        if (passengerCount < minPassengers) {
          return false;
        }
      }

      return true;
    });

    if (favoritesOnly) {
      filtered = filtered.filter((vehicle) =>
        favoriteVehiclesSet.has(vehicle.vehicle_id)
      );
    }

    // Sort vehicles
    if (sortBy === "price-low") {
      filtered = [...filtered].sort((a, b) => 
        Number(a.price_per_day || 0) - Number(b.price_per_day || 0)
      );
    } else if (sortBy === "price-high") {
      filtered = [...filtered].sort((a, b) => 
        Number(b.price_per_day || 0) - Number(a.price_per_day || 0)
      );
    }

    return filtered;
  }, [
    vehicles,
    searchQuery,
    vehicleTypeFilter,
    maxPrice,
    passengerFilter,
    sortBy,
    favoritesOnly,
    favoriteVehiclesSet,
  ]);

  return { filteredVehicles };
}

