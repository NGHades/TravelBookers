function ImagePreview({ selectedImages, onRemoveImage }) {
  if (selectedImages.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
      {selectedImages.map((file, index) => (
        <div key={index} style={{ position: "relative", display: "inline-block" }}>
          <img
            src={URL.createObjectURL(file)}
            alt={`Preview ${index + 1}`}
            style={{
              width: "100px",
              height: "100px",
              objectFit: "cover",
              borderRadius: "4px",
            }}
          />
          <button
            type="button"
            onClick={() => onRemoveImage(index)}
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ImagePreview;

