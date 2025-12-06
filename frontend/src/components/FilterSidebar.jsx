function FilterSidebar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  vehicleTypeFilter,
  onVehicleTypeFilterChange,
  maxPrice,
  onMaxPriceChange,
  maxVehiclePrice,
  passengerFilter,
  onPassengerFilterChange,
  sortBy,
  onSortByChange,
}) {
  return (
    <aside className="filters-sidebar">
      <form onSubmit={onSearchSubmit} className="search-form">
        <input
          type="text"
          placeholder="Search for vehicles..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
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
            onChange={(e) => onVehicleTypeFilterChange(e.target.value)}
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
            onChange={(e) => onMaxPriceChange(Number(e.target.value))}
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
            onChange={(e) => onPassengerFilterChange(e.target.value)}
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
            onChange={(e) => onSortByChange(e.target.value)}
          >
            <option value="none">None</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>
    </aside>
  );
}

export default FilterSidebar;

