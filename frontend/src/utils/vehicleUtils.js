/**
 * Gets a human-readable label for a vehicle from its ID
 * @param {number} vehicleId - The vehicle ID
 * @param {Array} vehicles - Array of vehicle objects
 * @returns {string} Vehicle label (e.g., "2023 Toyota Camry")
 */
export const getVehicleLabel = (vehicleId, vehicles) => {
  const vehicle = vehicles.find((v) => v.vehicle_id === vehicleId);
  if (!vehicle) return `Vehicle #${vehicleId}`;
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
};

