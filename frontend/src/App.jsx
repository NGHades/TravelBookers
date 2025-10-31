import "./App.css";
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NavBar from "./components/NavBar";
import Reservations from "./pages/Reservations";
import Deals from "./pages/Deals";
import Locations from "./pages/Locations";

function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="main-content">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/locations" element={<Locations />} />
      </Routes>
    </main>
  );
}

export default App;
