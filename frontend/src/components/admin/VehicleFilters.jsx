function VehicleFilters({
  searchTerm,
  onSearchChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  yearFilter,
  onYearFilterChange,
  uniqueYears,
}) {
  return (
    <section className="admin-dashboard__controls">
      <input
        type="search"
        placeholder="Search make, model, or year"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <div className="admin-dashboard__filters">
        <label>
          Availability
          <select
            value={availabilityFilter}
            onChange={(e) => onAvailabilityFilterChange(e.target.value)}
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>

        <label>
          Year
          <select
            value={yearFilter}
            onChange={(e) => onYearFilterChange(e.target.value)}
          >
            <option value="all">All</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

export default VehicleFilters;

