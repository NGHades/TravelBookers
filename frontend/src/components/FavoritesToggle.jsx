function FavoritesToggle({
  favoritesOnly,
  onToggle,
  currentUser,
  favoritesLoading,
  favoritesCount,
}) {
  return (
    <div className="favorites-toggle-bar">
      <button
        type="button"
        className={`favorites-toggle-btn ${favoritesOnly ? "active" : ""}`}
        onClick={onToggle}
        disabled={!currentUser || favoritesLoading}
      >
        {favoritesOnly ? "Show All Vehicles" : "Show Favorites Only"}
        {currentUser && (
          <span className="favorites-count">
            {favoritesCount} saved
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
  );
}

export default FavoritesToggle;

