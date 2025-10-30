import './App.css'
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import NavBar from './components/NavBar';

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="main-content">
      <NavBar />
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/deals" element={<Deals />}/>
        </Routes>
    </main>
  )
}

export default App
