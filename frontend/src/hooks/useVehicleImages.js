import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useVehicleImages(paginatedVehicles) {
  const [images, setImages] = useState({});
  const [imageError, setImageError] = useState("");

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

  return { images, imageError };
}

