import React, { useState, useEffect } from "react";
import { Heart, Home, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface ExchangeRate {
    currency: string;
    code: string;
    mid: number;
}

const MainPage: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [tableData, setTableData] = useState<ExchangeRate[]>([]);
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/exchange-rates");
                setTableData(response.data);
            } catch (error: any) {
                console.error("Błąd podczas pobierania danych z backendu:", error.message);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex min-w-1070px w-[calc(100vw-15px)] min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`h-screen sticky top-0 bg-indigo-600 text-white p-6 shadow-lg transition-all duration-400 ease-in-out transform ${
                    isSidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
                }`}
            >
                <div className={`transition-opacity ${isSidebarOpen ? "opacity-100" : "opacity-0"}`}>
                    <h2 className="text-3xl font-semibold mb-6">MENU</h2>
                    <div className="space-y-4">
                        <button
                            className={`flex flex-col truncate items-center justify-center mx-auto h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-380 ease-in-out transform ${
                                isSidebarOpen ? "w-40" : "w-0"
                            }`}
                            onClick={() => navigate("/")}
                        >
                            <Home className="w-30 h-30 mx-2" />
                            STRONA GŁÓWNA
                        </button>
                        <button
                            className={`flex flex-col items-center justify-center mx-auto h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
                                isSidebarOpen ? "w-40" : "w-0"
                            }`}
                        >
                            <Heart className="w-30 h-30 mx-2" />
                            ULUBIONE
                        </button>
                        <button
                            className={`flex flex-col items-center justify-center mx-auto mt-160 h-40 p-4 bg-indigo-500 rounded-lg shadow hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
                                isSidebarOpen ? "w-40" : "w-0"
                            }`}
                            onClick={() => navigate("/login")}
                        >
                            <LogIn className="w-30 h-30 mx-2" />
                            ZALOGUJ
                        </button>
                    </div>
                </div>
            </aside>
            <button
                className={`fixed top-2 bg-indigo-600 text-white text-3xl px-4 py-2 rounded-r-lg shadow-[-3px_0_10px_15px_rgb(0 0 0 / 0.1)] hover:bg-indigo-700 transition-all duration-400 ease-in-out transform ${
                    isSidebarOpen ? "left-64" : "left-0"
                }`}
                onClick={toggleSidebar}
            >
                {isSidebarOpen ? "←" : "≡ MENU"}
            </button>

            {/* Main Content */}
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

                {/* Table */}
                <div className="overflow-x-auto w-2/3 mx-auto bg-white shadow-lg rounded-lg p-4">
                    <table className="w-full margin-auto border-collapse border border-gray-300 rounded-lg">
                        <thead>
                            <tr className="bg-indigo-300 text-center text-2xl text-gray-800">
                                <th className="border border-gray-300 px-6 py-3">Nazwa waluty</th>
                                <th className="border border-gray-300 px-6 py-3">Kod waluty</th>
                                <th className="border border-gray-300 px-6 py-3">Kurs średni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, index) => (
                                <tr key={index} className="hover:bg-indigo-50">
                                    <td className="border border-gray-300 text-black px-6 py-3">{row.currency}</td>
                                    <td className="border border-gray-300 text-black px-6 py-3">{row.code}</td>
                                    <td className="border border-gray-300 text-black px-6 py-3">{row.mid}</td>
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