import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login: React.FC = () => {
    // Stany do przechowywania danych logowania i błędów
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    // Funkcja obsługująca logowanie
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Resetowanie błędów przed próbą logowania

        try {
            // Wysłanie żądania logowania do backendu
            const response = await axios.post("http://localhost:5000/api/login", {
                email,
                password,
            });

            // Pobranie tokena z odpowiedzi i zapisanie go w localStorage
            const { token } = response.data;
            localStorage.setItem("token", token);

            // Przekierowanie na stronę główną po zalogowaniu
            navigate("/");
        } catch (err: any) {
            // Obsługa błędów logowania
            console.error("Login error:", err.response?.data?.error || err.message);
            setError(err.response?.data?.error || "Wystąpił błąd podczas logowania.");
        }
    };

    return (
        <div className="flex w-screen h-screen bg-gray-50">
            {/* Główna sekcja logowania */}
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                {/* Logo i nagłówek */}
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img
                        alt=""
                        src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                        className="mx-auto h-10 w-auto"
                    />
                    <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                        Zaloguj się do swojego konta
                    </h2>
                </div>

                {/* Formularz logowania */}
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Pole adresu email */}
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
                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                />
                            </div>
                        </div>

                        {/* Pole hasła */}
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
                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                />
                            </div>
                        </div>

                        {/* Wyświetlanie błędów */}
                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        {/* Przycisk logowania */}
                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Zaloguj się
                            </button>
                        </div>
                    </form>

                    {/* Link do rejestracji */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Nie masz konta?{" "}
                        <Link
                            to="/register"
                            className="font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                            Zarejestruj się
                        </Link>
                    </p>

                    {/* Przycisk powrotu do strony głównej */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate("/")}
                            className="text-indigo-600 hover:text-indigo-500 font-semibold"
                        >
                            Powrót do strony głównej
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;