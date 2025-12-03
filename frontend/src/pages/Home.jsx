import VehicleCard from "../components/VehicleCard";
import { useState, useEffect, useMemo } from "react";
import "../css/Home.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PAGE_SIZE = 9;

function Home({ onRequireSignIn }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [images, setImages] = useState({}); // Map vehicle_id to array of images
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Fetch vehicles from API
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/api/vehicles`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch vehicles");
      }

      const vehiclesData = data.data || [];
      setVehicles(vehiclesData);

      // Fetch images for all vehicles
      const imagePromises = vehiclesData.map(async (vehicle) => {
        try {
          const imgResponse = await fetch(
            `${API_BASE}/api/images?vehicle_id=${vehicle.vehicle_id}`
          );
          const imgData = await imgResponse.json();
          return {
            vehicleId: vehicle.vehicle_id,
            images: imgData.success ? imgData.data || [] : [],
          };
        } catch (err) {
          console.error(`Error fetching images for vehicle ${vehicle.vehicle_id}:`, err);
          return { vehicleId: vehicle.vehicle_id, images: [] };
        }
      });

      const imageResults = await Promise.all(imagePromises);
      const imagesMap = {};
      imageResults.forEach(({ vehicleId, images: imgs }) => {
        imagesMap[vehicleId] = imgs;
      });
      setImages(imagesMap);
    } catch (err) {
      setError(err.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filter vehicles based on search query
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const searchTerm = searchQuery.toLowerCase();
      const vehicleString = `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase();
      return vehicleString.includes(searchTerm) && vehicle.availability_status;
    });
  }, [vehicles, searchQuery]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, page]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleSearch = async (e) => {
    e.preventDefault();
    // Search is handled by filtering, just reset to page 1
    setPage(1);
  };

  return (
    <div className="home">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search for vehicles..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button type="submit" className="search-button">
          Search
        </button>
      </form>

      {loading && <div className="loading">Loading vehicles...</div>}
      {error && <div className="error">{error}</div>}

      <div className="vehicles-grid">
        {paginatedVehicles.map((vehicle) => {
          const vehicleImages = images[vehicle.vehicle_id] || [];
          const firstImage = vehicleImages.length > 0 ? vehicleImages[0].image_url : null;
          
          return (
            <VehicleCard
              vehicle={vehicle}
              imageUrl={firstImage}
              key={vehicle.vehicle_id}
              onRequireSignIn={onRequireSignIn}
            />
          );
        })}
      </div>

      {filteredVehicles.length === 0 && !loading && (
        <div className="no-vehicles">No vehicles found. Try adjusting your search.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
