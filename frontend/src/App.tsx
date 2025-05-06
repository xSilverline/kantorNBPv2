import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import './App.css';

import MainPage from "./MainPage/MainPage.tsx";
import FavoritesPage from "./FavoritesPage/FavoritesPage";
import HistoryPage from "./HistoryPage/HistoryPage";
import CalculatorPage from "./CalculatorPage/CalculatorPage";
import Login from "./Login/Login.tsx";
import Register from "./Register/Register.tsx";

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