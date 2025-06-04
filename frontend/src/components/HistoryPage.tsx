import React, { useState, useEffect } from "react";
import { Home, Heart, LogIn, LogOut, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {ExchangeRateHistory} from "../types/currency.ts";



const HistoryPage: React.FC = () => {

    const [currencyCode, setCurrencyCode] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [historyData, setHistoryData] = useState<ExchangeRateHistory[]>([]);
    const [currencies, setCurrencies] = useState<string[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const todayDate = new Date();
    const yesterday = new Date();
    const ninetyDaysAgo = new Date();

    ninetyDaysAgo.setDate(todayDate.getDate()-90);
    yesterday.setDate(todayDate.getDate() - 1);
    const today = yesterday.toISOString().split("T")[0];
    const defaultDateStart = ninetyDaysAgo.toISOString().split('T')[0];

    const minDate = "2008-01-01";


    const ITEMS_PER_PAGE=10;

    useEffect(() => {
        const token = localStorage.getItem("token");
        if(!token)
        {
            navigate("/");
            return;
        }
        const fetchCurrencies = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/currencies");
                setCurrencies(response.data);
            } catch (error: any) {
                console.error("Error fetching currencies:", error.message);
            }
        };

        fetchCurrencies();

        setIsLoggedIn(!!token);
        setStartDate(defaultDateStart);
        setEndDate(today);
    }, []);

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

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        navigate("/login");
    };

    useEffect(() =>
        setCurrentPage(1),[startDate,endDate,currencyCode]);

    const getEndDateLimits = () => {
        if (!startDate) return { min: minDate, max: today };

        const start = new Date(startDate);
        const minEndDate = new Date(start);
        const maxEndDate = new Date(start);

        minEndDate.setDate(start.getDate());
        maxEndDate.setDate(start.getDate() + 90);

        return {
            min: startDate,
            max: maxEndDate > new Date(today) ? today : maxEndDate.toISOString().split('T')[0]
        };
    };

    const getStartDateLimits = () => {
        if (!endDate) return { min: minDate, max: today };

        const end = new Date(endDate);
        const minStartDate = new Date(end);
        const maxStartDate = new Date(end);

        minStartDate.setDate(end.getDate() - 90);
        maxStartDate.setDate(end.getDate());

        return {
            min: minStartDate < new Date(minDate) ? minDate : minStartDate.toISOString().split('T')[0],
            max: endDate
        };
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);

        if (newStartDate && endDate) {
            const start = new Date(newStartDate);
            const end = new Date(endDate);
            const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays > 90) {
                const newEndDate = new Date(start);
                newEndDate.setDate(start.getDate() + 90);
                setEndDate(newEndDate.toISOString().split('T')[0]);
            }
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = e.target.value;
        setEndDate(newEndDate);

        if (startDate && newEndDate) {
            const start = new Date(startDate);
            const end = new Date(newEndDate);
            const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays > 90) {
                const newStartDate = new Date(end);
                newStartDate.setDate(end.getDate() - 90);
                setStartDate(newStartDate.toISOString().split('T')[0]);
            }
        }
    };

    const endDateLimits = getEndDateLimits();
    const startDateLimits = getStartDateLimits();

    const sortedData = historyData
        .sort((a, b) => {
            return b.date.localeCompare(a.date);
        });

    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="bg-[#f6f6f6] min-h-screen w-screen text-gray-900 overflow-hidden">
            <div className="w-20 fixed h-screen bg-blue-200 float-left pt-4 rounded-r-2sm shadow p-4 border border-gray-200 flex flex-col gap-3">
                {isLoggedIn && (
                    <div>
                        <button className="text-gray-600 hover:text-black text-2xl cursor-pointer" onClick={() => {navigate("/")}}>
                            <Home className="w-10 h-10 m-1" />
                        </button>
                        <button className="text-gray-600 hover:text-black text-2xl cursor-pointer" onClick={() => {navigate("/favorites")}}>
                            <Heart className="w-10 h-10 m-1" />
                        </button>
                        <button className="text-gray-600 hover:text-black text-2xl cursor-pointer" onClick={() => {navigate("/calculator")}}>
                            <Calculator className="w-10 h-10 m-1" />
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
                <h1 className="text-6xl font-normal m-auto text-blue-main">KURSY WYMIANY WALUT NBP</h1>
            </div>
            <hr className="border-[#0000004a]" />

            {/* Main content */}
            <main className="flex-1 p-6">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 space-y-6">
                    <div className="grid grid-cols-3 md:grid-cols-3 gap-2">
                            <div className="flex flex-col  items-center space-y-4">
                                <label className="text-sm font-semibold mb-1 text-left">Waluta</label>
                                <select
                                    value={currencyCode}
                                    onChange={(e) => setCurrencyCode(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-2 w-full placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                            </div>
                            <div className="flex flex-col  items-center space-y-4">
                                <label className="text-sm font-semibold mb-1 text-left">Data początkowa</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={handleStartDateChange}
                                    min={minDate}
                                    max={startDateLimits.max}
                                    className="border border-gray-300 rounded px-3 py-2 w-full placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex flex-col  items-center space-y-4 ">
                                <label className="text-sm font-semibold mb-1 text-left">Data końcowa</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={handleEndDateChange}
                                    min={endDateLimits.min}
                                    max={today}
                                    className="border border-gray-300 rounded px-3 py-2 w-full placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                    </div>
                            <button
                                onClick={fetchHistory}
                                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-400 w-full"
                            >
                                Pokaż historię
                            </button>

                    <div className="grid grid-cols-2 text-center font-semibold border-b border-[#0000004a]  pb-2">
                        <span>Data</span>
                        <span>Kurs Wymiany</span>
                    </div>

                    {paginatedData.map((item,idx) => (
                        <div
                            key={idx}
                            className="h-16 grid grid-cols-2 items-center text-center bg-white rounded-md border-1 border-[#0000004a] shadow-md px-4 py-2 "
                        >
                            <span>{new Date(item.date).toLocaleDateString("pl-PL")}</span>
                            <div className="flex items-center justify-center ">
                                <span className="font-bold pl-4 ">{Number(item.mid).toFixed(4)}</span>
                            </div>

                        </div>
                    ))}

                    <div className="flex justify-between items-center pt-4 text-sm text-gray-600">
                        <span>{currentPage*10 <= sortedData.length ? currentPage*10 : sortedData.length} z {sortedData.length}</span>
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

                            {currentPage < totalPages+1  && totalPages > 1 && (
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

export default HistoryPage;