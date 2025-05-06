import React, { useState, useEffect } from "react";
import { Home, Heart, CalendarRange, LogIn, LogOut, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface ExchangeRateHistory {
    date: string;
    mid: number;
}

const HistoryPage: React.FC = () => {
    // Stany do zarządzania danymi historii kursów i widocznością paska bocznego
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currencyCode, setCurrencyCode] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [historyData, setHistoryData] = useState<ExchangeRateHistory[]>([]);
    const [currencies, setCurrencies] = useState<string[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    // Pobierz bieżącą datę w formacie YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];

    // Pobieranie listy walut i ustawianie domyślnych wartości
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/currencies");
                setCurrencies(response.data);
            } catch (error: any) {
                console.error("Error fetching currencies:", error.message);
            }
        };

        fetchCurrencies();

        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token); // Ustawia isLoggedIn na true, jeśli token istnieje
        setEndDate(today); // Ustaw domyślną wartość dla endDate na dzisiejszą datę
    }, []);

    // Pobieranie historii kursów walut
    const fetchHistory = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/history", {
                params: {
                    code: currencyCode,
                    startDate,
                    endDate,
                },
            });
            setHistoryData(response.data);
        } catch (error: any) {
            console.error("Error fetching history:", error.message);
        }
    };

    // Funkcja przełączająca widoczność paska bocznego
    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    // Funkcja obsługująca wylogowanie
    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        navigate("/login");
    };

    return (
        <div className="flex min-w-1070px w-[calc(100vw-15px)] min-h-screen bg-gray-50">
            {/* Pasek boczny */}
            <aside
                className={`h-screen sticky top-0 bg-indigo-600 text-white p-6 shadow-lg transition-all duration-400 ease-in-out transform flex flex-col justify-between ${
                    isSidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
                }`}
            >
                <div className={`transition-opacity ${isSidebarOpen ? "opacity-100" : "opacity-0"} flex flex-col flex-grow`}>
                    <h2 className="text-3xl font-semibold mb-6">MENU</h2>
                    <div className="space-y-4">
                        {/* Przycisk nawigacji do strony głównej */}
                        <button
                            className={`flex flex-col truncate items-center justify-center mx-auto h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-380 ease-in-out transform ${
                                isSidebarOpen ? "w-40" : "w-0"
                            }`}
                            onClick={() => navigate("/")}
                        >
                            <Home className="w-30 h-30 mx-2" />
                            STRONA GŁÓWNA
                        </button>
                        {isLoggedIn && (
                            <>
                                {/* Przycisk nawigacji do ulubionych */}
                                <button
                                    className={`flex flex-col items-center justify-center mx-auto h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
                                        isSidebarOpen ? "w-40" : "w-0"
                                    }`}
                                    onClick={() => navigate("/favorites")}
                                >
                                    <Heart className="w-30 h-30 mx-2" />
                                    ULUBIONE
                                </button>
                                {/* Przycisk nawigacji do historii */}
                                <button
                                    className={`flex flex-col items-center justify-center mx-auto h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
                                        isSidebarOpen ? "w-40" : "w-0"
                                    }`}
                                    onClick={() => navigate("/history")}
                                >
                                    <CalendarRange className="w-30 h-30 mx-2" />
                                    HISTORIA
                                </button>
                                {/* Przycisk nawigacji do kalkulatora */}
                                <button
                                    className={`flex flex-col items-center justify-center mx-auto h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
                                        isSidebarOpen ? "w-40" : "w-0"
                                    }`}
                                    onClick={() => navigate("/calculator")}
                                >
                                    <Calculator className="w-30 h-30 mx-2" />
                                    KALKULATOR
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Przycisk ZALOGUJ/WYLOGUJ */}
                <button
                    className={`flex flex-col items-center justify-center mx-auto mt-4 h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
                        isSidebarOpen ? "w-40" : "w-0"
                    }`}
                    onClick={isLoggedIn ? handleLogout : () => navigate("/login")}
                >
                    {isLoggedIn ? (
                        <>
                            <LogOut className="w-30 h-30 mx-2" />
                            WYLOGUJ
                        </>
                    ) : (
                        <>
                            <LogIn className="w-30 h-30 mx-2" />
                            ZALOGUJ
                        </>
                    )}
                </button>
            </aside>

            {/* Przycisk przełączania paska bocznego */}
            <button
                className={`fixed top-2 bg-indigo-600 text-white text-3xl px-4 py-2 rounded-r-lg shadow-[-3px_0_10px_15px_rgb(0 0 0 / 0.1)] hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
                    isSidebarOpen ? "left-64" : "left-0"
                }`}
                onClick={toggleSidebar}
            >
                {isSidebarOpen ? "←" : "≡ MENU"}
            </button>

            {/* Główna sekcja historii kursów */}
            <main className="flex-1 p-8 items-center content-center">
                <div className="flex flex-row">
                    <img
                        className="ml-auto w-30 h-30 mr-10"
                        src="../../public/icon.png"
                        alt="Kurs Wymiany walut"
                    />
                    <h1 className="mr-auto pt-7 text-3xl text-center font-bold mb-10 text-gray-800">
                        Historia kursów wymiany walut
                    </h1>
                </div>
                <div className="flex flex-col items-center space-y-4">
                    {/* Wybór waluty */}
                    <select
                        value={currencyCode}
                        onChange={(e) => setCurrencyCode(e.target.value)}
                        className="p-2 border rounded w-1/3 bg-indigo-500 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                    >
                        <option value="" disabled>
                            Wybierz kod waluty
                        </option>
                        {currencies.map((code) => (
                            <option key={code} value={code}>
                                {code}
                            </option>
                        ))}
                    </select>
                    {/* Wybór daty początkowej */}
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={today}
                        className="p-2 border rounded w-1/3 bg-indigo-500 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                    />
                    {/* Wybór daty końcowej */}
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        max={today}
                        className="p-2 border rounded w-1/3 bg-indigo-500 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                    />
                    {/* Przycisk pobierania historii */}
                    <button
                        onClick={fetchHistory}
                        className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Pokaż historię
                    </button>
                </div>

                {/* Tabela historii kursów */}
                <div className="overflow-x-auto w-2/3 mx-auto bg-white shadow-lg rounded-lg p-4">
                    <table className="w-full margin-auto border-collapse border border-gray-300 rounded-lg">
                        <thead>
                            <tr className="bg-indigo-300 text-center text-2xl text-gray-800">
                                <th className="border border-gray-300 px-6 py-3">Data</th>
                                <th className="border border-gray-300 px-6 py-3">Kurs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyData.map((entry, index) => (
                                <tr key={index} className="hover:bg-indigo-50">
                                    <td className="border border-gray-300 text-black px-6 py-3">
                                        {new Date(entry.date).toLocaleDateString("pl-PL")}
                                    </td>
                                    <td className="border border-gray-300 text-black px-6 py-3">{entry.mid}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default HistoryPage;