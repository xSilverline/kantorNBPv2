import React, { useState, useEffect } from "react";
import { Heart, LogIn, LogOut, CalendarRange, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ExchangeRate } from "../types/currency.ts";

// Stała określająca liczbę elementów na stronie
const ITEMS_PER_PAGE = 10;

/**
 * Główny komponent strony - wyświetla listę kursów walut NBP
 * z możliwością filtrowania, sortowania i paginacji
 */
const MainPage: React.FC = () => {
    // ======================== Stany komponentu ========================
    const [tableData, setTableData] = useState<ExchangeRate[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [favorites, setFavorites] = useState<number[]>([]);
    const [maxSelectableDate, setMaxSelectableDate] = useState<string>("");
    const navigate = useNavigate();

    // Stany dla filtrów i paginacji
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('name');
    const [date, setDate] = useState('');

    // ======================== Funkcje pomocnicze ========================

    /**
     * Pobiera najnowszą dostępną datę z backendu
     * Ustawia domyślną datę dla selektora dat
     */
    const fetchLatestDate = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/latest-date");
            const { latestDate, maxSelectableDate } = response.data;
            setDate(latestDate);
            setMaxSelectableDate(maxSelectableDate);
            return latestDate;
        } catch (error) {
            console.error("Error fetching latest date:", error);
            // Fallback - ustaw wczorajszą datę
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];
            today.setDate(today.getDate() - 1);
            const fallbackDate = today.toISOString().split("T")[0];
            setDate(fallbackDate);
            setMaxSelectableDate(todayStr);
            return fallbackDate;
        }
    };

    /**
     * Obsługuje zmianę daty w selektorze
     * Nie blokuje wyboru - backend zwróci pustą tablicę dla nieprawidłowych dat
     */
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = e.target.value;
        setDate(selectedDate);
    };

    /**
     * Dodaje lub usuwa walutę z ulubionych użytkownika
     * Wymaga zalogowania użytkownika
     */
    const toggleFavorite = async (code: string) => {
        if (!isLoggedIn) return;

        try {
            const token = localStorage.getItem("token");
            const userId = JSON.parse(atob(token!.split(".")[1])).id;

            // Znajdź ID waluty na podstawie kodu
            const currencyId = tableData.find((row) => row.code === code)?.rate_id;
            if (!currencyId) return;

            const response = await axios.post("http://localhost:5000/api/favorites", {
                userId,
                currencyId,
            });

            // Zaktualizuj lokalny stan ulubionych
            if (response.data.message === "Dodano do ulubionych") {
                setFavorites((prev) => [...prev, currencyId]);
            } else {
                setFavorites((prev) => prev.filter((id) => id !== currencyId));
            }
        } catch (error: any) {
            console.error("Error toggling favorite:", error.message);
        }
    };

    /**
     * Wylogowuje użytkownika i czyści dane sesji
     */
    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
    };

    // ======================== Efekty React ========================

    /**
     * Efekt inicjalizujący - pobiera najnowszą datę przy pierwszym załadowaniu
     */
    useEffect(() => {
        fetchLatestDate();
    }, []);

    /**
     * Efekt pobierający dane kursów walut gdy zmieni się data
     * Również sprawdza status logowania i pobiera ulubione użytkownika
     */
    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);

        const fetchData = async () => {
            if (!date) return;

            try {
                // Pobierz kursy walut dla wybranej daty
                const response = await axios.get("http://localhost:5000/api/exchange-rates", {
                    params: { date: date }
                });
                setTableData(response.data);

                // Jeśli użytkownik zalogowany, pobierz jego ulubione
                if (token) {
                    const userId = JSON.parse(atob(token.split(".")[1])).id;
                    const favoritesResponse = await axios.get(`http://localhost:5000/api/favorites/${userId}`);
                    setFavorites(favoritesResponse.data);
                }
            } catch (error: any) {
                console.error("Error while fetching data from the backend:", error.message);
                setTableData([]); // Ustaw pustą tablicę przy błędzie
            }
        };

        fetchData();
    }, [date]);

    /**
     * Resetuje paginację do pierwszej strony gdy zmienią się filtry
     */
    useEffect(() => {
        setCurrentPage(1);
    }, [search, sort]);

    // ======================== Przetwarzanie danych ========================

    /**
     * Filtrowanie i sortowanie danych na podstawie wybranych kryteriów
     */
    const filteredData = tableData
        .filter((item) =>
            item.currency.toLowerCase().includes(search.toLowerCase()) ||
            item.code.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sort === 'code') return a.code.localeCompare(b.code);
            if (sort === 'name') return a.currency.localeCompare(b.currency);
            if (sort === 'ByRate') return a.mid - b.mid;
            return 0;
        });

    /**
     * Obliczenie liczby stron i danych dla aktualnej strony
     */
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // ======================== Renderowanie komponentu ========================
    return (
        <div className="bg-[#f6f6f6] min-h-screen min-w-screen text-gray-900 overflow-hidden">
            
            {/* ======================== Pasek boczny ======================== */}
            <div className="w-20 min-h-screen bg-blue-200 float-left pt-4 rounded-r-2sm shadow p-4 border border-gray-200 flex flex-col gap-3">
                
                {/* Przyciski nawigacji dla zalogowanych użytkowników */}
                {isLoggedIn && (
                    <div>
                        <button className="text-gray-600 hover:text-black text-2xl cursor-pointer" onClick={() => navigate("/favorites")}>
                            <Heart className="w-10 h-10 m-1" />
                        </button>
                        <button className="text-gray-600 hover:text-black text-2xl cursor-pointer" onClick={() => navigate("/calculator")}>
                            <Calculator className="w-10 h-10 m-1" />
                        </button>
                        <button className="text-gray-600 hover:text-black text-2xl cursor-pointer" onClick={() => navigate("/history")}>
                            <CalendarRange className="w-10 h-10 m-1" />
                        </button>
                    </div>
                )}

                {/* Sekcja logowania/wylogowania na dole paska */}
                <div className="absolute p-0 m-0 left-0 bottom-0 align-middle w-20">
                    <hr className="gray-line" />
                    {isLoggedIn ? (
                        <div className="align-middle items-center gap-2 text-sm text-gray-600 w-full">
                            <div className="w-20 flex flex-col justify-center">
                                <button 
                                    className="w-20 h-15 float-left flex items-center justify-center text-2xl hover:text-black cursor-pointer"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-10 h-10" />
                                </button>
                                <label className="text-sm w-20 text-center font-semibold mb-5">Wyloguj</label>
                            </div>
                        </div>
                    ) : (
                        <div className="align-middle items-center gap-2 text-sm text-gray-600 w-full">
                            <div className="w-20 flex flex-col justify-center">
                                <button 
                                    className="w-20 h-15 float-left flex items-center justify-center text-2xl hover:text-black cursor-pointer"
                                    onClick={() => navigate("/login")}
                                >
                                    <LogIn className="w-10 h-10" />
                                </button>
                                <label className="text-sm w-20 text-center font-semibold mb-5">Zaloguj</label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ======================== Nagłówek strony ======================== */}
            <div className="text-center p-6">
                <h1 className="text-6xl">KURSY WYMIANY WALUT NBP</h1>
            </div>
            <hr className="border-[#0000004a]" />

            {/* ======================== Główna zawartość ======================== */}
            <main className="flex-1 p-6">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 space-y-6">
                    
                    {/* Sekcja filtrów */}
                    <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
                        
                        {/* Pole wyszukiwania */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1 text-left">Wyszukaj</label>
                            <input
                                type="text"
                                placeholder="Wpisz kod lub nazwę"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full"
                            />
                        </div>
                        
                        {/* Selektor sortowania */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1 text-left">Sortuj według</label>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full"
                            >
                                <option value="code">Kod</option>
                                <option value="name">Nazwa</option>
                                <option value="ByRate">Kurs</option>
                            </select>
                        </div>
                        
                        {/* Selektor daty */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1 text-left">Data</label>
                            <input
                                type="date"
                                value={date}
                                max={maxSelectableDate}
                                min="2008-01-02"
                                onChange={handleDateChange}
                                className="cursor-pointer border border-gray-300 rounded px-3 py-2 w-full"
                            />
                        </div>
                    </div>

                    {/* Nagłówek tabeli */}
                    <div className="grid grid-cols-3 text-center font-semibold border-b border-[#0000004a] pb-2">
                        <span>Kod</span>
                        <span>Nazwa Waluty</span>
                        <span>Kurs Wymiany</span>
                    </div>

                    {/* Wiersze z kursami walut */}
                    {paginatedData.length > 0 ? (
                        paginatedData.map((item) => (
                            <div
                                key={item.rate_id}
                                className="h-16 grid grid-cols-3 items-center text-center bg-white rounded-md border-1 border-[#0000004a] shadow-md px-4 py-2"
                            >
                                <span className="mr-5 text-lg">{item.code}</span>
                                <span>{item.currency}</span>
                                <div className="flex items-center justify-center pl-16 gap-10">
                                    <span className="font-bold pl-4">{Number(item.mid).toFixed(4)}</span>
                                    {/* Przycisk dodania do ulubionych - tylko dla zalogowanych */}
                                    {isLoggedIn && (
                                        <div>
                                            <button className="text-xl" onClick={() => toggleFavorite(item.code)}>
                                                <Heart className={`w-5 h-5 mx-2 ${
                                                    favorites.includes(item.rate_id) 
                                                        ? 'text-red-500 hover:text-black' 
                                                        : 'text-black hover:text-red-500'
                                                }`} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        /* Komunikat gdy brak danych */
                        <div className="text-center py-8 text-gray-500">
                            Brak danych dla wybranej daty
                        </div>
                    )}

                    {/* ======================== Paginacja ======================== */}
                    <div className="flex justify-between items-center pt-4 text-sm text-gray-600">
                        {/* Informacja o liczbie wyświetlanych elementów */}
                        <span>
                            {currentPage * 10 <= filteredData.length ? currentPage * 10 : filteredData.length} z {filteredData.length}
                        </span>
                        
                        {/* Przyciski nawigacji stron */}
                        <div className="flex items-center space-x-1">
                            {/* Przycisk poprzednia strona */}
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                                &lt;
                            </button>

                            {/* Pierwsza strona */}
                            {currentPage > 0 && (
                                <>
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        className={`px-2 py-1 rounded hover:bg-gray-200 ${currentPage === 1 ? "bg-gray-300" : ""}`}
                                    >
                                        1
                                    </button>
                                    {currentPage > 3 && <span className="px-1">...</span>}
                                </>
                            )}

                            {/* Strony wokół aktualnej */}
                            {[currentPage - 1, currentPage, currentPage + 1].map((page) => (
                                page > 1 && page < totalPages && (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-2 py-1 rounded hover:bg-gray-200 ${currentPage === page ? "bg-gray-300" : ""}`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}

                            {/* Ostatnia strona */}
                            {currentPage < totalPages + 1 && totalPages > 1 && (
                                <>
                                    {currentPage < totalPages - 2 && <span className="px-1">...</span>}
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        className={`px-2 py-1 rounded hover:bg-gray-200 ${currentPage === totalPages ? "bg-gray-300" : ""}`}
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}

                            {/* Przycisk następna strona */}
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MainPage;