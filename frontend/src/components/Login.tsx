import React, { useState } from "react";
import {useNavigate } from "react-router-dom";
import axios from "axios";
import {Home, Lock} from "lucide-react";

const Login: React.FC = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {

            const response = await axios.post("http://localhost:5000/api/login", {
                email,
                password,
            });

            const { token } = response.data;
            localStorage.setItem("token", token);

            navigate("/");
        } catch (err: any) {

            console.error("Login error:", err.response?.data?.error || err.message);
            setError(err.response?.data?.error || "Wystąpił błąd podczas logowania.");
        }
    };

    return (
        <div className="bg-[#f6f6f6] min-h-screen w-screen text-gray-900 overflow-hidden">
            <div className="w-20 fixed h-screen bg-blue-200 float-left pt-4 rounded-r-2sm shadow p-4 border border-gray-200 flex flex-col gap-3">
                <div>
                    <button className="text-gray-600 hover:text-black text-2xl cursor-pointer" onClick={() => {navigate("/")}}>
                        <Home className="w-10 h-10 m-1" />
                    </button>
                </div>
            </div>

            <div className="text-center pt-6 pb-6">
                <h1 className="text-6xl font-normal text-blue-main">KURSY WYMIANY WALUT NBP</h1>
            </div>
            <hr className="border-[#0000004a]" />

            <main className="flex-1 p-6">
                <div className="max-w-xl mx-auto md:my-20 bg-white border border-[#0000004a] rounded-lg shadow-md p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <Lock className="w-auto mt-5 text-blue-500 mx-auto h-15"></Lock>
                    <h2 className="mt-5 text-center text-2xl/9 tracking-tight text-gray-900">
                        LOGOWANIE
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form onSubmit={handleLogin} className="space-y-6">

                        <div>
                            <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                                Adres email
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                                Hasło
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6"
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-blue-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
                            >
                                Zaloguj się
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Nie masz konta?{" "}
                        <button className="font-semibold text-blue-500 hover:text-blue-400" onClick={() => {navigate("/register")}}>
                            Zarejestruj się
                        </button>
                    </p>

                    {/* Przycisk powrotu do strony głównej */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate("/")}
                            className="text-blue-500 hover:text-blue-400 font-semibold cursor-pointer"
                        >
                            Powrót do strony głównej
                        </button>
                    </div>
                </div>
            </div>
                </div>
            </main>
        </div>
    );
};

export default Login;