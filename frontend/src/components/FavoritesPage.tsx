import React, { useState, useEffect } from "react";
import { Heart, Home, LogIn, LogOut, CalendarRange, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {ExchangeRate} from "../types/currency.ts";



const ITEMS_PER_PAGE=10;

const FavoritesPage: React.FC = () => {

    const [favoritesData, setFavoritesData] = useState<ExchangeRate[]>([]);
    // const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const todayDate = new Date();
    const yesterday = new Date();
    yesterday.setDate(todayDate.getDate() - 1);
    const [currentPage, setCurrentPage] = useState(1);
    const today = yesterday.toISOString().split("T")[0];
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('name');
    const [date, setDate] = useState(today);
    const [hasChanged, setHasChanged] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);

        if(!token)
        {
            navigate("/");
            return;
        }

        const fetchFavorites = async () => {
            if (!token) return;

            try {
                const userId = JSON.parse(atob(token.split(".")[1])).id;
                const favoritesResponse = await axios.get(`http://localhost:5000/api/favorites/${userId}`);
                const favoriteIds = favoritesResponse.data;

                const exchangeRatesResponse = await axios.get("http://localhost:5000/api/exchange-rates");
                const allRates = exchangeRatesResponse.data;

                const filteredFavorites = allRates.filter((rate: ExchangeRate) =>
                    favoriteIds.includes(rate.rate_id)
                );

                setFavoritesData(filteredFavorites);

                // if (filteredFavorites.length > 0) {
                //     const rawDate = filteredFavorites[0].date;
                //     const formattedDate = new Date(rawDate).toLocaleDateString("pl-PL");
                //     setEffectiveDate(formattedDate);
                // }
            } catch (error: any) {
                console.error("Błąd podczas pobierania ulubionych:", error.message);
            }
        };

        fetchFavorites();
        setHasChanged(false);
    }, [hasChanged,date]);

    const toggleFavorite = async (code: string) => {
        if (!isLoggedIn) return;

        try {
            const token = localStorage.getItem("token");
            const userId = JSON.parse(atob(token!.split(".")[1])).id;

            const currencyId = favoritesData.find((row) => row.code === code)?.rate_id;
            if (!currencyId) return;

            const response = await axios.post("http://localhost:5000/api/favorites", {
                userId,
                currencyId,
            });

            if(response.status == 200)
            {
                setHasChanged(true);
            }
        } catch (error: any) {
            console.error("Error toggling favorite:", error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        navigate("/");
    };
    useEffect(() =>
        setCurrentPage(1),[search,sort]);

    const filteredData = favoritesData
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

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="bg-[#f6f6f6] min-h-screen min-w-screen text-gray-900 overflow-hidden">
            {/* Sidebar */}

            <div className="w-20 min-h-screen bg-blue-200 float-left pt-4 rounded-r-2sm shadow p-4 border border-gray-200 flex flex-col gap-3">
                {isLoggedIn && (
                    <div>
                        {/*<button className="text-gray-600 hover:text-black text-2xl cursor-pointer"> <Home className="w-10 h-10 m-1" /></button>*/}
                        <button className="text-gray-600 hover:text-black text-2xl cursor-pointer" onClick={() => {navigate("/")}}>
                            <Home className="w-10 h-10 m-1" />
                        </button>
                        <button className="text-gray-600 hover:text-black text-2xl cursor-pointer" onClick={() => {navigate("/calculator")}}>
                            <Calculator className="w-10 h-10 m-1" />
                        </button>
                        <button className="text-gray-600 hover:text-black text-2xl cursor-pointer" onClick={() => {navigate("/history")}}>
                            <CalendarRange className="w-10 h-10 m-1" />
                        </button>
                    </div>
                )}

                <div className="absolute p-0 m-0 left-0 bottom-0 align-middle w-20">
                    <hr className="gray-line" />
                    {isLoggedIn ? (
                        <div className="align-middle items-center gap-2 text-sm text-gray-600 w-full">
                            <div className="w-20 flex flex-col justify-center">
                                <button className="w-20 h-15 float-left flex items-center justify-center text-2xl hover:text-black cursor-pointer "
                                        onClick={() => {
                                            handleLogout();
                                        }} >
                                    <LogOut className="w-10 h-10"
                                    /> </button>
                                <label className="text-sm w-20 text-center font-semibold mb-5 ">Wyloguj</label>
                            </div>
                        </div>
                    ) : (
                        <div className="align-middle items-center gap-2 text-sm text-gray-600 w-full">
                            <div className="w-20 flex flex-col justify-center">
                                <button className="w-20 h-15 float-left flex items-center justify-center text-2xl hover:text-black cursor-pointer "
                                        onClick={() => {
                                            navigate("/login")
                                        }} >
                                    <LogIn className="w-10 h-10"
                                    /> </button>
                                <label className="text-sm w-20 text-center font-semibold mb-5 ">Zaloguj</label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center p-6">
                <h1 className="text-6xl font-normal text-blue-main">KURSY WYMIANY WALUT NBP</h1>
            </div>
            <hr className="border-[#0000004a]" />

            {/* Main content */}
            <main className="flex-1 p-6">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 space-y-6">
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1 text-left">Data</label>
                            <input
                                type="date"
                                value={date}
                                max={today}
                                onChange={(e) => setDate(e.target.value)}
                                className="cursor-pointer border border-gray-300 rounded px-3 py-2 w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 text-center font-semibold border-b border-[#0000004a]  pb-2">
                        <span>Kod</span>
                        <span>Nazwa Waluty</span>
                        <span>Kurs Wymiany</span>
                    </div>

                    {paginatedData.map((item) => (
                        <div
                            key={item.rate_id}
                            className="h-16 grid grid-cols-3 items-center text-center bg-white rounded-md border-1 border-[#0000004a] shadow-md px-4 py-2 "
                        >
                            <span className="mr-5 text-lg">{item.code}</span>
                            <span>{item.currency}</span>
                            <div className="flex items-center justify-center pl-16 gap-10">
                                <span className="font-bold pl-4 ">{Number(item.mid).toFixed(4)}</span>
                                <button className="text-xl " onClick={() => toggleFavorite(item.code)}>
                                    <Heart className={`w-5 h-5 mx-2 text-red-500 hover:text-black`} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-between items-center pt-4 text-sm text-gray-600">
                        <span>{currentPage*10 <= filteredData.length ? currentPage*10 : filteredData.length} z {filteredData.length}</span>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                                &lt;
                            </button>

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

                            {currentPage < totalPages+1 && totalPages > 1 && (
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

export default FavoritesPage;