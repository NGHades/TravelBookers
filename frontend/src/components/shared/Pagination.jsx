function Pagination({ page, totalPages, onPageChange, className = "", variant = "default" }) {
  const isAdmin = variant === "admin";
  const ButtonComponent = isAdmin ? "button" : "button";
  const buttonClass = isAdmin ? "secondary-btn" : "pagination-btn";
  const containerClass = isAdmin ? "admin-dashboard__pagination" : `pagination ${className}`;
  const infoClass = isAdmin ? "" : "pagination-info";

  return (
    <div className={containerClass}>
      <ButtonComponent
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={buttonClass}
      >
        Previous
      </ButtonComponent>
      <span className={infoClass}>
        Page {page} of {totalPages}
      </span>
      <ButtonComponent
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={buttonClass}
      >
        Next
      </ButtonComponent>
    </div>
  );
}

export default Pagination;

