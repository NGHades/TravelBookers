function ReturnModal({ rental, returnComment, onReturnCommentChange, onConfirm, onCancel, processing }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Process Vehicle Return</h3>
        <p>
          Mark rental #{rental.rental_id} for vehicle #{rental.vehicle_id} as
          returned. You can add a return note below (condition, fuel level, etc.).
        </p>
        <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }} className="admin-form">
          <div className="admin-form-field">
            <label htmlFor="return_comment">Return Comment</label>
            <textarea
              id="return_comment"
              rows={4}
              value={returnComment}
              onChange={(e) => onReturnCommentChange(e.target.value)}
              placeholder="Optional: note vehicle condition, mileage, fuel level, etc."
            />
          </div>
          <div className="form-actions" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={onCancel}
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={processing}
            >
              {processing ? "Processing..." : "Mark as Returned"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReturnModal;

