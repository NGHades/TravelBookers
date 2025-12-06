import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FilterSidebar from "../components/FilterSidebar";
import FavoritesToggle from "../components/FavoritesToggle";
import VehicleGrid from "../components/VehicleGrid";
import Pagination from "../components/shared/Pagination";
import { useFavorites } from "../hooks/useFavorites";
import { useVehicleFilters } from "../hooks/useVehicleFilters";
import { useVehicleImages } from "../hooks/useVehicleImages";
import "../css/Home.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PAGE_SIZE = 9;

function Home({ onRequireSignIn }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });
  const [favoriteMutationId, setFavoriteMutationId] = useState(null);
  
  // Filter states
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("any");
  const [maxPrice, setMaxPrice] = useState(300);
  const [passengerFilter, setPassengerFilter] = useState("any");
  const [sortBy, setSortBy] = useState("none");

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
    } catch (err) {
      setError(err.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    const shouldShowFavorites = location.state?.showFavorites;
    if (shouldShowFavorites && currentUser) {
      setFavoritesOnly(true);
      navigate(location.pathname, { replace: true, state: {} });
    } else if (shouldShowFavorites && !currentUser) {
      if (onRequireSignIn) {
        onRequireSignIn("Sign in to view favorites");
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, currentUser, onRequireSignIn]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "user") {
        if (event.newValue) {
          try {
            setCurrentUser(JSON.parse(event.newValue));
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    };

    const handleUserSignedIn = (event) => {
      setCurrentUser(event.detail);
    };

    const handleUserSignedOut = () => {
      setCurrentUser(null);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("userSignedIn", handleUserSignedIn);
    window.addEventListener("userSignedOut", handleUserSignedOut);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("userSignedIn", handleUserSignedIn);
      window.removeEventListener("userSignedOut", handleUserSignedOut);
    };
  }, []);

  // Use favorites hook
  const {
    favorites,
    setFavorites,
    favoritesLoading,
    favoritesError,
    favoriteVehiclesSet,
    favoriteMap,
  } = useFavorites(currentUser);

  useEffect(() => {
    if (!currentUser) {
      setFavoritesOnly(false);
    }
  }, [currentUser]);

  // Get max price from vehicles for slider
  const maxVehiclePrice = useMemo(() => {
    if (vehicles.length === 0) return 300;
    return Math.max(...vehicles.map(v => Number(v.price_per_day || 0)), 300);
  }, [vehicles]);

  // Use vehicle filters hook
  const { filteredVehicles } = useVehicleFilters({
    vehicles,
    searchQuery,
    vehicleTypeFilter,
    maxPrice,
    passengerFilter,
    sortBy,
    favoritesOnly,
    favoriteVehiclesSet,
  });

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, page]);

  // Use vehicle images hook
  const { images, imageError } = useVehicleImages(paginatedVehicles);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    vehicleTypeFilter,
    maxPrice,
    passengerFilter,
    sortBy,
    favoritesOnly,
  ]);
  
  // Update max price slider when vehicles load
  useEffect(() => {
    if (maxVehiclePrice > 0 && maxPrice === 300) {
      setMaxPrice(Math.ceil(maxVehiclePrice / 100) * 100); // Round up to nearest 100
    }
  }, [maxVehiclePrice]);

  const handleSearch = async (e) => {
    e.preventDefault();
    // Search is handled by filtering, just reset to page 1
    setPage(1);
  };

  const handleToggleFavorite = async (vehicle) => {
    if (!currentUser) {
      if (onRequireSignIn) {
        onRequireSignIn("Sign in to manage favorites");
      }
      return;
    }

    const existingFavorite = favoriteMap.get(vehicle.vehicle_id);

    try {
      setFavoriteMutationId(vehicle.vehicle_id);
      setFavoritesError("");

      if (existingFavorite) {
        const res = await fetch(
          `${API_BASE}/api/favorites/${existingFavorite.favorite_id}`,
          {
            method: "DELETE",
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to remove favorite");
        }
        setFavorites((prev) =>
          prev.filter((fav) => fav.favorite_id !== existingFavorite.favorite_id)
        );
      } else {
        const res = await fetch(`${API_BASE}/api/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: currentUser.user_id,
            vehicle_id: vehicle.vehicle_id,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to add favorite");
        }
        setFavorites((prev) => [...prev, data.data]);
      }
    } catch (err) {
      setFavoritesError(
        err.message || "Something went wrong updating favorites."
      );
    } finally {
      setFavoriteMutationId(null);
    }
  };

  return (
    <div className="home">
      <div className="home-layout">
        <FilterSidebar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearch}
          vehicleTypeFilter={vehicleTypeFilter}
          onVehicleTypeFilterChange={setVehicleTypeFilter}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          maxVehiclePrice={maxVehiclePrice}
          passengerFilter={passengerFilter}
          onPassengerFilterChange={setPassengerFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        <main className="vehicles-content">
          {loading && <div className="loading">Loading vehicles...</div>}
          {error && <div className="error">{error}</div>}
          {imageError && <div className="error">{imageError}</div>}
          {favoritesError && (
            <div className="error" style={{ marginBottom: "1rem" }}>
              {favoritesError}
            </div>
          )}

          <FavoritesToggle
            favoritesOnly={favoritesOnly}
            onToggle={() => setFavoritesOnly((prev) => !prev)}
            currentUser={currentUser}
            favoritesLoading={favoritesLoading}
            favoritesCount={favorites.length}
          />

          <VehicleGrid
            vehicles={paginatedVehicles}
            images={images}
            favoriteVehiclesSet={favoriteVehiclesSet}
            favoriteMutationId={favoriteMutationId}
            onRequireSignIn={onRequireSignIn}
            onToggleFavorite={handleToggleFavorite}
          />

          {filteredVehicles.length === 0 && !loading && (
            <div className="no-vehicles">No vehicles found. Try adjusting your search or filters.</div>
          )}

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default Home;
