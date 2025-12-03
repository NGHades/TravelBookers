import "./App.css";
import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import NavBar from "./components/NavBar";
import Reservations from "./pages/Reservations";
import Deals from "./pages/Deals";
import Locations from "./pages/Locations";
import SignUp from "./pages/SignUp";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminVehicles from "./pages/AdminVehicles";
import VehicleDetail from "./pages/VehicleDetail";
import SignInModal from "./components/SignInModal";

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [signInMessage, setSignInMessage] = useState("");

  const openSignInModal = (message) => {
    setSignInMessage(message || "Sign in to continue");
    setIsSignInModalOpen(true);
  };

  const closeSignInModal = () => {
    setIsSignInModalOpen(false);
  };

  return (
    <main className="main-content">
      {!isAdminRoute && <NavBar onRequireSignIn={openSignInModal} />}
      <Routes>
        <Route path="/" element={<Home onRequireSignIn={openSignInModal} />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/vehicles" element={<AdminVehicles />} />
      </Routes>
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={closeSignInModal}
        message={signInMessage}
      />
    </main>
  );
}

export default App;
