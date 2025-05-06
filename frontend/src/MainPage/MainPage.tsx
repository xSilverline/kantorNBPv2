import React, { useState, useEffect } from "react";
import { Heart, Home, LogIn, LogOut, CalendarRange, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface ExchangeRate {
    rate_id: number;
    currency: string;
    code: string;
    mid: number;
    date: string;
}

const MainPage: React.FC = () => {
    // Stany do zarządzania danymi i widocznością paska bocznego
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [tableData, setTableData] = useState<ExchangeRate[]>([]);
    const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [favorites, setFavorites] = useState<number[]>([]); // Lista ulubionych walut
    const navigate = useNavigate();

    // Pobieranie danych z backendu
    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);

        const fetchData = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/exchange-rates");
                setTableData(response.data);

                if (response.data.length > 0) {
                    const rawDate = response.data[0].date;
                    const formattedDate = new Date(rawDate).toLocaleDateString("pl-PL");
                    setEffectiveDate(formattedDate);
                }

                if (token) {
                    const userId = JSON.parse(atob(token.split(".")[1])).id;
                    const favoritesResponse = await axios.get(`http://localhost:5000/api/favorites/${userId}`);
                    setFavorites(favoritesResponse.data);
                }
            } catch (error: any) {
                console.error("Error while fetching data from the backend:", error.message);
            }
        };

        fetchData();
    }, []);

    // Funkcja do zarządzania ulubionymi walutami
    const toggleFavorite = async (code: string) => {
        if (!isLoggedIn) return;

        try {
            const token = localStorage.getItem("token");
            const userId = JSON.parse(atob(token!.split(".")[1])).id;

            const currencyId = tableData.find((row) => row.code === code)?.rate_id;
            if (!currencyId) return;

            const response = await axios.post("http://localhost:5000/api/favorites", {
                userId,
                currencyId,
            });

            if (response.data.message === "Dodano do ulubionych") {
                setFavorites((prev) => [...prev, currencyId]);
            } else {
                setFavorites((prev) => prev.filter((id) => id !== currencyId));
            }
        } catch (error: any) {
            console.error("Error toggling favorite:", error.message);
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

            {/* Główna sekcja */}
            <main className="flex-1 p-8 items-center content-center">
                <div className="flex flex-row">
                    <img
                        className="ml-auto w-30 h-30 mr-10"
                        src="../../public/icon.png"
                        alt="Kurs Wymiany walut"
                    />
                    <h1 className="mr-auto pt-7 text-3xl text-center font-bold mb-10 text-gray-800">
                        Kursy Wymiany Walut NBP
                    </h1>
                </div>

                {/* Wyświetlanie daty kursów */}
                {effectiveDate && (
                    <div className="text-center text-xl text-gray-700 mb-6">
                        Data kursów: <strong>{effectiveDate}</strong>
                    </div>
                )}

                {/* Tabela kursów walut */}
                <div className="overflow-x-auto w-2/3 mx-auto bg-white shadow-lg rounded-lg p-4">
                    <table className="w-full margin-auto border-collapse border border-gray-300 rounded-lg">
                        <thead>
                            <tr className="bg-indigo-300 text-center text-2xl text-gray-800">
                                <th className="border border-gray-300 px-6 py-3">Nazwa waluty</th>
                                <th className="border border-gray-300 px-6 py-3">Kod waluty</th>
                                <th className="border border-gray-300 px-6 py-3">Kurs średni</th>
                                {isLoggedIn && (
                                    <th className="border border-gray-300 px-6 py-3"></th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, index) => (
                                <tr key={index} className="hover:bg-indigo-50">
                                    <td className="border border-gray-300 text-black px-6 py-3">{row.currency}</td>
                                    <td className="border border-gray-300 text-black px-6 py-3">{row.code}</td>
                                    <td className="border border-gray-300 text-black px-6 py-3">{row.mid}</td>
                                    {isLoggedIn && (
                                        <td className="border border-gray-300 text-center px-6 py-3">
                                            <Heart
                                                className={`w-6 h-6 cursor-pointer ${
                                                    favorites.includes(row.rate_id) ? "text-red-500" : "text-gray-400"
                                                }`}
                                                onClick={() => toggleFavorite(row.code)}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default MainPage;