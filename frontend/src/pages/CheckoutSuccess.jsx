function CheckoutSuccess() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        padding: "2rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "2.5rem 3rem",
          borderRadius: "1rem",
          boxShadow: "0 15px 30px rgba(15, 23, 42, 0.15)",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "1.75rem",
            marginBottom: "0.75rem",
            color: "#111827",
          }}
        >
          Payment Successful
        </h2>
        <p style={{ marginBottom: "0.25rem", color: "#4b5563" }}>
          Your rental payment was processed successfully.
        </p>
        <p style={{ color: "#6b7280" }}>
          You can close this page or return to browse more vehicles.
        </p>
      </div>
    </div>
  );
}

export default CheckoutSuccess;


