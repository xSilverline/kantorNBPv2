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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(todayDate.getDate()-30);
    yesterday.setDate(todayDate.getDate() - 1);
    const today = yesterday.toISOString().split("T")[0];
    const defaultDateStart = thirtyDaysAgo.toISOString().split('T')[0];

    // const today = new Date().toISOString().split("T")[0];

    const ITEMS_PER_PAGE=10;

    // Pobieranie listy walut i ustawianie domyślnych wartości
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

        setIsLoggedIn(!!token); // Ustawia isLoggedIn na true, jeśli token istnieje
        setStartDate(defaultDateStart);
        setEndDate(today); // Ustaw domyślną wartość dla endDate na dzisiejszą datę
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
        <div className="bg-[#f6f6f6] min-h-screen min-w-screen text-gray-900 overflow-hidden">
            {/* Sidebar */}

            <div className="w-20 min-h-screen bg-blue-200 float-left pt-4 rounded-r-2sm shadow p-4 border border-gray-200 flex flex-col gap-3">
                {isLoggedIn && (
                    <div>
                        {/*<button className="text-gray-600 hover:text-black text-2xl cursor-pointer"> <Home className="w-10 h-10 m-1" /></button>*/}
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
                                    onChange={(e) => setStartDate(e.target.value)}
                                    max={today}
                                    className="border border-gray-300 rounded px-3 py-2 w-full placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex flex-col  items-center space-y-4 ">
                                <label className="text-sm font-semibold mb-1 text-left">Data końcowa</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
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



                    {/* Table header */}
                    <div className="grid grid-cols-2 text-center font-semibold border-b border-[#0000004a]  pb-2">
                        <span>Data</span>
                        <span>Kurs Wymiany</span>
                    </div>

                    {/* Currency rows */}
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

    // return (
    //     <div className="flex min-w-1070px w-[calc(100vw-15px)] min-h-screen bg-gray-50">
    //         {/* Pasek boczny */}
    //         <aside
    //             className={`h-screen sticky top-0 bg-indigo-600 text-white p-6 shadow-lg transition-all duration-400 ease-in-out transform flex flex-col justify-between ${
    //                 isSidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
    //             }`}
    //         >
    //             <div className={`transition-opacity ${isSidebarOpen ? "opacity-100" : "opacity-0"} flex flex-col flex-grow`}>
    //                 <h2 className="text-3xl font-semibold mb-6">MENU</h2>
    //                 <div className="space-y-4">
    //                     {/* Przycisk nawigacji do strony głównej */}
    //                     <button
    //                         className={`flex flex-col truncate items-center justify-center mx-auto h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-380 ease-in-out transform ${
    //                             isSidebarOpen ? "w-40" : "w-0"
    //                         }`}
    //                         onClick={() => navigate("/")}
    //                     >
    //                         <Home className="w-30 h-30 mx-2" />
    //                         STRONA GŁÓWNA
    //                     </button>
    //                     {isLoggedIn && (
    //                         <>
    //                             {/* Przycisk nawigacji do ulubionych */}
    //                             <button
    //                                 className={`flex flex-col items-center justify-center mx-auto h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
    //                                     isSidebarOpen ? "w-40" : "w-0"
    //                                 }`}
    //                                 onClick={() => navigate("/favorites")}
    //                             >
    //                                 <Heart className="w-30 h-30 mx-2" />
    //                                 ULUBIONE
    //                             </button>
    //                             {/* Przycisk nawigacji do historii */}
    //                             <button
    //                                 className={`flex flex-col items-center justify-center mx-auto h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
    //                                     isSidebarOpen ? "w-40" : "w-0"
    //                                 }`}
    //                                 onClick={() => navigate("/history")}
    //                             >
    //                                 <CalendarRange className="w-30 h-30 mx-2" />
    //                                 HISTORIA
    //                             </button>
    //                             {/* Przycisk nawigacji do kalkulatora */}
    //                             <button
    //                                 className={`flex flex-col items-center justify-center mx-auto h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
    //                                     isSidebarOpen ? "w-40" : "w-0"
    //                                 }`}
    //                                 onClick={() => navigate("/calculator")}
    //                             >
    //                                 <Calculator className="w-30 h-30 mx-2" />
    //                                 KALKULATOR
    //                             </button>
    //                         </>
    //                     )}
    //                 </div>
    //             </div>
    //
    //             {/* Przycisk ZALOGUJ/WYLOGUJ */}
    //             <button
    //                 className={`flex flex-col items-center justify-center mx-auto mt-4 h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
    //                     isSidebarOpen ? "w-40" : "w-0"
    //                 }`}
    //                 onClick={isLoggedIn ? handleLogout : () => navigate("/login")}
    //             >
    //                 {isLoggedIn ? (
    //                     <>
    //                         <LogOut className="w-30 h-30 mx-2" />
    //                         WYLOGUJ
    //                     </>
    //                 ) : (
    //                     <>
    //                         <LogIn className="w-30 h-30 mx-2" />
    //                         ZALOGUJ
    //                     </>
    //                 )}
    //             </button>
    //         </aside>
    //
    //         {/* Przycisk przełączania paska bocznego */}
    //         <button
    //             className={`fixed top-2 bg-indigo-600 text-white text-3xl px-4 py-2 rounded-r-lg shadow-[-3px_0_10px_15px_rgb(0 0 0 / 0.1)] hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
    //                 isSidebarOpen ? "left-64" : "left-0"
    //             }`}
    //             onClick={toggleSidebar}
    //         >
    //             {isSidebarOpen ? "←" : "≡ MENU"}
    //         </button>
    //
    //         {/* Główna sekcja historii kursów */}
    //         <main className="flex-1 p-8 items-center content-center">
    //             <div className="flex flex-row">
    //                 <img
    //                     className="ml-auto w-30 h-30 mr-10"
    //                     src="../../public/icon.png"
    //                     alt="Kurs Wymiany walut"
    //                 />
    //                 <h1 className="mr-auto pt-7 text-3xl text-center font-bold mb-10 text-gray-800">
    //                     Historia kursów wymiany walut
    //                 </h1>
    //             </div>
    //             <div className="flex flex-col items-center space-y-4">
    //                 {/* Wybór waluty */}
    //                 <select
    //                     value={currencyCode}
    //                     onChange={(e) => setCurrencyCode(e.target.value)}
    //                     className="p-2 border rounded w-1/3 bg-indigo-500 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-700"
    //                 >
    //                     <option value="" disabled>
    //                         Wybierz kod waluty
    //                     </option>
    //                     {currencies.map((code) => (
    //                         <option key={code} value={code}>
    //                             {code}
    //                         </option>
    //                     ))}
    //                 </select>
    //                 {/* Wybór daty początkowej */}
    //                 <input
    //                     type="date"
    //                     value={startDate}
    //                     onChange={(e) => setStartDate(e.target.value)}
    //                     max={today}
    //                     className="p-2 border rounded w-1/3 bg-indigo-500 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-700"
    //                 />
    //                 {/* Wybór daty końcowej */}
    //                 <input
    //                     type="date"
    //                     value={endDate}
    //                     onChange={(e) => setEndDate(e.target.value)}
    //                     max={today}
    //                     className="p-2 border rounded w-1/3 bg-indigo-500 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-700"
    //                 />
    //                 {/* Przycisk pobierania historii */}
    //                 <button
    //                     onClick={fetchHistory}
    //                     className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
    //                 >
    //                     Pokaż historię
    //                 </button>
    //             </div>
    //
    //             {/* Tabela historii kursów */}
    //             <div className="overflow-x-auto w-2/3 mx-auto bg-white shadow-lg rounded-lg p-4">
    //                 <table className="w-full margin-auto border-collapse border border-gray-300 rounded-lg">
    //                     <thead>
    //                         <tr className="bg-indigo-300 text-center text-2xl text-gray-800">
    //                             <th className="border border-gray-300 px-6 py-3">Data</th>
    //                             <th className="border border-gray-300 px-6 py-3">Kurs</th>
    //                         </tr>
    //                     </thead>
    //                     <tbody>
    //                         {historyData.map((entry, index) => (
    //                             <tr key={index} className="hover:bg-indigo-50">
    //                                 <td className="border border-gray-300 text-black px-6 py-3">
    //                                     {new Date(entry.date).toLocaleDateString("pl-PL")}
    //                                 </td>
    //                                 <td className="border border-gray-300 text-black px-6 py-3">{entry.mid}</td>
    //                             </tr>
    //                         ))}
    //                     </tbody>
    //                 </table>
    //             </div>
    //         </main>
    //     </div>
    // );
};

export default HistoryPage;