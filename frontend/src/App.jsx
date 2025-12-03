import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import NavBar from "./components/NavBar";
import Reservations from "./pages/Reservations";
import Deals from "./pages/Deals";
import Locations from "./pages/Locations";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminVehicles from "./pages/AdminVehicles";
import VehicleDetail from "./pages/VehicleDetail";

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <main className="main-content">
      {!isAdminRoute && <NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/vehicles" element={<AdminVehicles />} />
      </Routes>
    </main>
  );
}

export default App;
