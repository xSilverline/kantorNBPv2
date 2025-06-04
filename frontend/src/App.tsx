import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import './App.css';

import MainPage from "./components/MainPage.tsx";
import FavoritesPage from "./components/FavoritesPage.tsx";
import HistoryPage from "./components/HistoryPage.tsx";
import CalculatorPage from "./components/CalculatorPage.tsx";
import Login from "./components/Login.tsx";
import Register from "./components/Register.tsx";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </Router>
    );
}

export default App;