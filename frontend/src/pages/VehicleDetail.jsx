import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/free-mode";
import "../css/VehicleDetail.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [images, setImages] = useState([]);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch vehicle details
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch vehicle
        const vehicleResponse = await fetch(`${API_BASE}/api/vehicles/${id}`);
        const vehicleData = await vehicleResponse.json();

        if (!vehicleResponse.ok || !vehicleData.success) {
          throw new Error(vehicleData.message || "Failed to fetch vehicle");
        }

        setVehicle(vehicleData.data);

        // Fetch images
        const imagesResponse = await fetch(
          `${API_BASE}/api/images?vehicle_id=${id}`
        );
        const imagesData = await imagesResponse.json();

        if (imagesResponse.ok && imagesData.success) {
          setImages(imagesData.data || []);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch vehicle details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="vehicle-detail">
        <div className="loading">Loading vehicle details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicle-detail">
        <div className="error">{error}</div>
        <button onClick={() => navigate(-1)} className="back-btn">
          Go Back
        </button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="vehicle-detail">
        <div className="error">Vehicle not found</div>
        <button onClick={() => navigate(-1)} className="back-btn">
          Go Back
        </button>
      </div>
    );
  }

  const defaultImage = "https://via.placeholder.com/800x600?text=No+Image";
  const displayImages = images.length > 0 ? images : [{ image_url: defaultImage }];

  return (
    <div className="vehicle-detail">
      <button onClick={() => navigate(-1)} className="back-btn">
        ← Back
      </button>

      <div className="vehicle-detail-content">
        {/* Image Carousel using Swiper */}
        <div className="vehicle-carousel">
          <Swiper
            spaceBetween={10}
            navigation={images.length > 1}
            thumbs={{ swiper: thumbsSwiper }}
            modules={[Navigation, Thumbs, FreeMode]}
            className="carousel-main-swiper"
          >
            {displayImages.map((img, index) => (
              <SwiperSlide key={img.image_id || index}>
                <img
                  src={img.image_url}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Image ${index + 1}`}
                  className="carousel-main-image"
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={10}
              slidesPerView={4}
              freeMode={true}
              watchSlidesProgress={true}
              modules={[FreeMode, Navigation, Thumbs]}
              className="carousel-thumbnails-swiper"
            >
              {images.map((img, index) => (
                <SwiperSlide key={img.image_id}>
                  <img
                    src={img.image_url}
                    alt={`${vehicle.make} ${vehicle.model} - Thumbnail ${index + 1}`}
                    className="thumbnail"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* Vehicle Information */}
        <div className="vehicle-info-section">
          <h1 className="vehicle-title">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>

          <div className="vehicle-meta">
            <span className={`availability-badge ${vehicle.availability_status ? "available" : "unavailable"}`}>
              {vehicle.availability_status ? "Available" : "Unavailable"}
            </span>
            <span className="vehicle-price">
              ${Number(vehicle.price_per_day || 0).toFixed(2)} per day
            </span>
          </div>

          {vehicle.description && (
            <div className="vehicle-description">
              <h2>Description</h2>
              <p>{vehicle.description}</p>
            </div>
          )}

          {/* Comments and Ratings Section */}
          <div className="comments-ratings-section">
            <h2>Reviews & Ratings</h2>

            {/* Rating Summary */}
            <div className="rating-summary">
              <div className="rating-display">
                <span className="rating-number">4.5</span>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="star filled">★</span>
                  ))}
                </div>
                <span className="rating-count">(24 reviews)</span>
              </div>
            </div>

            {/* Add Review Form (UI only, not connected to backend) */}
            <div className="add-review-form">
              <h3>Write a Review</h3>
              <div className="review-rating-input">
                <label>Rating:</label>
                <div className="rating-input-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="star-btn"
                      onClick={() => alert(`Selected ${star} stars (not connected to backend)`)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="review-comment-input">
                <label htmlFor="review-comment">Your Review:</label>
                <textarea
                  id="review-comment"
                  placeholder="Share your experience with this vehicle..."
                  rows="4"
                  onClick={() => alert("Review form (not connected to backend)")}
                />
              </div>
              <button
                type="button"
                className="submit-review-btn"
                onClick={() => alert("Submit review (not connected to backend)")}
              >
                Submit Review
              </button>
            </div>

            {/* Reviews List (Sample UI only) */}
            <div className="reviews-list">
              <h3>Customer Reviews</h3>
              
              {/* Sample Review 1 */}
              <div className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">John D.</span>
                  <div className="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="star filled">★</span>
                    ))}
                  </div>
                  <span className="review-date">2 weeks ago</span>
                </div>
                <p className="review-text">
                  Great vehicle! Very clean and reliable. The pickup and drop-off process was smooth.
                </p>
              </div>

              {/* Sample Review 2 */}
              <div className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">Sarah M.</span>
                  <div className="review-rating">
                    {[1, 2, 3, 4].map((star) => (
                      <span key={star} className="star filled">★</span>
                    ))}
                    <span className="star">★</span>
                  </div>
                  <span className="review-date">1 month ago</span>
                </div>
                <p className="review-text">
                  Good car overall. Some minor wear and tear but nothing major. Would rent again.
                </p>
              </div>

              {/* Sample Review 3 */}
              <div className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">Mike T.</span>
                  <div className="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="star filled">★</span>
                    ))}
                  </div>
                  <span className="review-date">2 months ago</span>
                </div>
                <p className="review-text">
                  Excellent experience! The car was in perfect condition and the service was top-notch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleDetail;

