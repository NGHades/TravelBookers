import VehicleCard from "../components/VehicleCard";
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/Home.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PAGE_SIZE = 9;

function Home({ onRequireSignIn }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [images, setImages] = useState({}); // Map vehicle_id to array of images
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
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
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState("");
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

  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      setFavoritesOnly(false);
      return;
    }

    const controller = new AbortController();

    const fetchFavorites = async () => {
      try {
        setFavoritesLoading(true);
        setFavoritesError("");
        const res = await fetch(
          `${API_BASE}/api/favorites?user_id=${currentUser.user_id}`,
          { signal: controller.signal }
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load favorites");
        }

        setFavorites(data.data || []);
      } catch (err) {
        if (err.name === "AbortError") return;
        setFavoritesError(err.message || "Failed to load favorites");
      } finally {
        setFavoritesLoading(false);
      }
    };

    fetchFavorites();

    return () => controller.abort();
  }, [currentUser]);

  const favoriteVehiclesSet = useMemo(() => {
    return new Set(favorites.map((fav) => fav.vehicle_id));
  }, [favorites]);

  const favoriteMap = useMemo(() => {
    const map = new Map();
    favorites.forEach((fav) => {
      map.set(fav.vehicle_id, fav);
    });
    return map;
  }, [favorites]);

  // Get max price from vehicles for slider
  const maxVehiclePrice = useMemo(() => {
    if (vehicles.length === 0) return 300;
    return Math.max(...vehicles.map(v => Number(v.price_per_day || 0)), 300);
  }, [vehicles]);

  // Filter and sort vehicles
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

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, page]);

  // Fetch images for vehicles visible on the current page
  useEffect(() => {
    if (paginatedVehicles.length === 0) {
      return;
    }

    const missingIds = paginatedVehicles
      .map((vehicle) => vehicle.vehicle_id)
      .filter((id) => !images[id]);

    if (missingIds.length === 0) {
      return;
    }

    const controller = new AbortController();

    const fetchImages = async () => {
      try {
        setImageError("");
        const params = new URLSearchParams();
        params.set("vehicle_ids", missingIds.join(","));
        const response = await fetch(
          `${API_BASE}/api/images?${params.toString()}`,
          { signal: controller.signal }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch vehicle images");
        }

        const nextImages = {};
        (data.data || []).forEach((image) => {
          if (!nextImages[image.vehicle_id]) {
            nextImages[image.vehicle_id] = [];
          }
          nextImages[image.vehicle_id].push(image);
        });

        setImages((prev) => ({ ...prev, ...nextImages }));
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Error fetching vehicle images:", err);
        setImageError(err.message || "Failed to fetch vehicle images");
      }
    };

    fetchImages();

    return () => controller.abort();
  }, [paginatedVehicles, images]);

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
        {/* Sidebar with filters */}
        <aside className="filters-sidebar">
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

          <div className="filters-section">
            <h3 className="filters-title">Filters</h3>
            
            {/* Vehicle Type Filter */}
            <div className="filter-group">
              <label htmlFor="vehicle-type" className="filter-label">Vehicle Type</label>
              <select
                id="vehicle-type"
                className="filter-select"
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
              >
                <option value="any">Any</option>
                <option value="compact">Compact</option>
                <option value="car">Car</option>
                <option value="suv">SUV</option>
                <option value="truck">Truck</option>
                <option value="coupe">Coupe</option>
              </select>
            </div>

            {/* Price Filter */}
            <div className="filter-group">
              <label htmlFor="price-range" className="filter-label">
                Max Price: ${maxPrice}
              </label>
              <input
                id="price-range"
                type="range"
                min="50"
                max={Math.max(maxVehiclePrice, 300)}
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="filter-slider"
              />
              <div className="price-range-labels">
                <span>$50</span>
                <span>${Math.max(maxVehiclePrice, 300)}</span>
              </div>
            </div>

            {/* Passenger Filter */}
            <div className="filter-group">
              <label htmlFor="passenger-filter" className="filter-label">Passengers</label>
              <select
                id="passenger-filter"
                className="filter-select"
                value={passengerFilter}
                onChange={(e) => setPassengerFilter(e.target.value)}
              >
                <option value="any">Any</option>
                <option value="2+">2+</option>
                <option value="4+">4+</option>
                <option value="6+">6+</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="filter-group">
              <label htmlFor="sort-by" className="filter-label">Sort By</label>
              <select
                id="sort-by"
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="none">None</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <main className="vehicles-content">
          {loading && <div className="loading">Loading vehicles...</div>}
          {error && <div className="error">{error}</div>}
          {imageError && <div className="error">{imageError}</div>}
          {favoritesError && (
            <div className="error" style={{ marginBottom: "1rem" }}>
              {favoritesError}
            </div>
          )}

          <div className="favorites-toggle-bar">
            <button
              type="button"
              className={`favorites-toggle-btn ${
                favoritesOnly ? "active" : ""
              }`}
              onClick={() => setFavoritesOnly((prev) => !prev)}
              disabled={!currentUser || favoritesLoading}
            >
              {favoritesOnly ? "Show All Vehicles" : "Show Favorites Only"}
              {currentUser && (
                <span className="favorites-count">
                  {favorites.length} saved
                </span>
              )}
            </button>
            {!currentUser && (
              <span className="favorites-hint">
                Sign in to save and view favorites.
              </span>
            )}
            {favoritesLoading && currentUser && (
              <span className="favorites-hint">Loading favorites...</span>
            )}
          </div>

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
                  isFavorited={favoriteVehiclesSet.has(vehicle.vehicle_id)}
                  onToggleFavorite={handleToggleFavorite}
                  favoriteBusy={favoriteMutationId === vehicle.vehicle_id}
                />
              );
            })}
          </div>

          {filteredVehicles.length === 0 && !loading && (
            <div className="no-vehicles">No vehicles found. Try adjusting your search or filters.</div>
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
        </main>
      </div>
    </div>
  );
}

export default Home;
