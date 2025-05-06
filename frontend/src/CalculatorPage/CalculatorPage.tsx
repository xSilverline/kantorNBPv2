import React, { useState, useEffect } from "react";
import { Home, Heart, CalendarRange, LogIn, LogOut, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CalculatorPage: React.FC = () => {
    // Stany do przechowywania danych kalkulatora
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currencies, setCurrencies] = useState<string[]>(["PLN"]); // Dodano PLN jako domyślną walutę
    const [fromCurrency, setFromCurrency] = useState("");
    const [toCurrency, setToCurrency] = useState("");
    const [amount, setAmount] = useState<number | string>("");
    const [result, setResult] = useState<number | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    // Pobieranie listy walut z API
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/currencies");
                setCurrencies(["PLN", ...response.data]); // Dodano PLN do listy walut
            } catch (error: any) {
                console.error("Error fetching currencies:", error.message);
            }
        };

        fetchCurrencies();

        // Sprawdzenie, czy użytkownik jest zalogowany
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token); // Ustawia isLoggedIn na true, jeśli token istnieje
    }, []);

    // Funkcja obliczająca wymianę walut
    const calculateExchange = async () => {
        if (!fromCurrency || !toCurrency || !amount) {
            alert("Proszę uzupełnić wszystkie pola.");
            return;
        }

        if (Number(amount) <= 0) {
            alert("Kwota musi być większa niż 0.");
            return;
        }

        try {
            const response = await axios.get("http://localhost:5000/api/exchange-rates");
            const rates = response.data;

            const fromRate = fromCurrency === "PLN" ? 1 : rates.find((rate: any) => rate.code === fromCurrency)?.mid;
            const toRate = toCurrency === "PLN" ? 1 : rates.find((rate: any) => rate.code === toCurrency)?.mid;

            if (fromRate && toRate) {
                const calculatedResult = (Number(amount) * fromRate) / toRate;
                setResult(calculatedResult);
            } else {
                alert("Nie znaleziono kursów dla wybranych walut.");
            }
        } catch (error: any) {
            console.error("Error calculating exchange:", error.message);
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

            {/* Główna sekcja kalkulatora */}
            <main className="flex-1 p-8 items-center content-center">
                <div className="flex flex-row">
                    <img
                        className="ml-auto w-30 h-30 mr-10"
                        src="../../public/icon.png"
                        alt="Kurs Wymiany walut"
                    />
                    <h1 className="mr-auto pt-7 text-3xl text-center font-bold mb-10 text-gray-800">
                        Kalkulator wymiany walut
                    </h1>
                </div>
                <div className="flex flex-col items-center space-y-4">
                    {/* Wybór waluty początkowej */}
                    <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        className="p-2 border rounded w-1/3 bg-indigo-500 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                    >
                        <option value="" disabled>
                            Wybierz walutę początkową
                        </option>
                        {currencies.map((code) => (
                            <option key={code} value={code}>
                                {code}
                            </option>
                        ))}
                    </select>
                    {/* Wprowadzenie ilości */}
                    <input
                        type="number"
                        placeholder="Ilość"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0" // Blokada wartości mniejszych niż 0
                        className="p-2 border rounded w-1/3 bg-indigo-500 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                    />
                    {/* Wybór waluty docelowej */}
                    <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value)}
                        className="p-2 border rounded w-1/3 bg-indigo-500 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                    >
                        <option value="" disabled>
                            Wybierz walutę docelową
                        </option>
                        {currencies.map((code) => (
                            <option key={code} value={code}>
                                {code}
                            </option>
                        ))}
                    </select>
                    {/* Przycisk obliczania */}
                    <button
                        onClick={calculateExchange}
                        className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Oblicz
                    </button>
                </div>
                {/* Wyświetlanie wyniku */}
                {result !== null && (
                    <div className="mt-6 text-center text-xl text-gray-800">
                        Wynik: <strong>{result.toFixed(2)}</strong> {toCurrency}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CalculatorPage;