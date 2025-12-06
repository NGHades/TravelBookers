import { useEffect, useState, useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useFavorites(currentUser) {
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState("");

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

  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
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

  return {
    favorites,
    setFavorites,
    favoritesLoading,
    favoritesError,
    favoriteVehiclesSet,
    favoriteMap,
  };
}

