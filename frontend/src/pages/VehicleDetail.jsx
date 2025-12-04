import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, FreeMode } from "swiper/modules";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  
  // Date picker state - default to today (1 day rental)
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

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

  // Calculate number of days and total cost
  const calculateDays = () => {
    if (!startDate) return 1;
    // If end date not selected yet, use start date (1 day rental)
    const effectiveEndDate = endDate || startDate;
    const diffTime = Math.abs(effectiveEndDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
    return diffDays;
  };

  const numberOfDays = calculateDays();
  const pricePerDay = Number(vehicle.price_per_day || 0);
  const totalCost = pricePerDay * numberOfDays;

  // Handle date range change with 14-day limit
  const handleDateChange = (dates) => {
    const [start, end] = dates;
    
    if (start && end) {
      // Both dates selected - check if range exceeds 14 days
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (diffDays > 14) {
        // Limit to 14 days from start date
        const maxEndDate = new Date(start);
        maxEndDate.setDate(maxEndDate.getDate() + 13); // 13 days added = 14 total days
        setStartDate(start);
        setEndDate(maxEndDate);
      } else {
        setStartDate(start);
        setEndDate(end);
      }
    } else if (start) {
      // Only start date selected (user clicked first date, end date selection in progress)
      setStartDate(start);
      // Keep endDate as null or reset it - user will select end date next
      setEndDate(null);
    } else {
      // Both dates cleared - reset to default (today, 1 day)
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
    }
  };

  // Filter dates to prevent selecting end date more than 14 days from start
  // This function is called for each date in the calendar
  const filterDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    // Always allow selecting today or future dates
    if (dateToCheck < today) return false;
    
    // If we have a start date and are selecting end date, limit to 14 days
    // Note: With selectsRange, when startDate is set but endDate is null,
    // we're in "selecting end date" mode
    if (startDate && !endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(dateToCheck - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays <= 14;
    }
    
    // When selecting start date or both dates are set, allow any future date
    return true;
  };

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

          {/* Vehicle Specifications */}
          {(vehicle.vehicle_type || vehicle.mpg || vehicle.passenger_count || vehicle.drivetrain) && (
            <div className="vehicle-specifications">
              <h2>Specifications</h2>
              <div className="specs-grid">
                {vehicle.vehicle_type && (
                  <div className="spec-item">
                    <span className="spec-label">Type:</span>
                    <span className="spec-value">{vehicle.vehicle_type.charAt(0).toUpperCase() + vehicle.vehicle_type.slice(1)}</span>
                  </div>
                )}
                {vehicle.mpg && (
                  <div className="spec-item">
                    <span className="spec-label">MPG:</span>
                    <span className="spec-value">{vehicle.mpg}</span>
                  </div>
                )}
                {vehicle.passenger_count && (
                  <div className="spec-item">
                    <span className="spec-label">Passengers:</span>
                    <span className="spec-value">{vehicle.passenger_count}</span>
                  </div>
                )}
                {vehicle.drivetrain && (
                  <div className="spec-item">
                    <span className="spec-label">Drivetrain:</span>
                    <span className="spec-value">{vehicle.drivetrain.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date Picker Section */}
          <div className="booking-section">
            <h2>Select Rental Dates</h2>
            <div className="date-picker-container">
              <label htmlFor="rental-dates">Rental Period:</label>
              <DatePicker
                id="rental-dates"
                selected={startDate}
                onChange={handleDateChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                minDate={new Date()}
                filterDate={filterDate}
                dateFormat="MMM dd, yyyy"
                className="date-picker-input"
                placeholderText="Select start and end dates"
                isClearable={false}
              />
              <div className="rental-info">
                <span className="rental-days">
                  {numberOfDays} {numberOfDays === 1 ? "day" : "days"}
                </span>
                <span className="rental-note">(Maximum 14 days)</span>
              </div>
            </div>

            {/* Total Cost Display */}
            <div className="total-cost-section">
              <div className="cost-breakdown">
                <div className="cost-line">
                  <span>Price per day:</span>
                  <span>${pricePerDay.toFixed(2)}</span>
                </div>
                <div className="cost-line">
                  <span>Number of days:</span>
                  <span>{numberOfDays}</span>
                </div>
                <div className="cost-line total">
                  <span>Total Cost:</span>
                  <span className="total-amount">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button 
              type="button" 
              className="checkout-btn"
              onClick={() => {
                // Placeholder for checkout functionality
                console.log("Checkout clicked", { startDate, endDate, totalCost, numberOfDays });
              }}
            >
              Proceed to Checkout
            </button>
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

