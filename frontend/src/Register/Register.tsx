import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
    // Stany do przechowywania danych rejestracji i błędów
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const navigate = useNavigate();

    // Funkcja obsługująca rejestrację
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Resetowanie błędów przed próbą rejestracji
        setSuccess(null); // Resetowanie komunikatów sukcesu

        try {
            // Wysłanie żądania rejestracji do backendu
            const response = await axios.post("http://localhost:5000/api/register", {
                username,
                email,
                password,
            });

            // Rejestracja zakończona sukcesem
            setSuccess(response.data.message);
            setUsername("");
            setEmail("");
            setPassword("");
        } catch (err: any) {
            // Obsługa błędów rejestracji
            console.error("Błąd rejestracji:", err.response?.data?.error || err.message);
            setError(err.response?.data?.error || "Wystąpił błąd podczas rejestracji.");
        }
    };

    return (
        <div className="flex w-screen h-screen bg-gray-50">
            {/* Główna sekcja rejestracji */}
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                {/* Logo i nagłówek */}
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img
                        alt=""
                        src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                        className="mx-auto h-10 w-auto"
                    />
                    <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                        Zarejestruj swoje konto
                    </h2>
                </div>

                {/* Formularz rejestracji */}
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form onSubmit={handleRegister} className="space-y-6">
                        {/* Pole nazwy użytkownika */}
                        <div>
                            <label htmlFor="username" className="block text-sm/6 font-medium text-gray-900">
                                Nazwa użytkownika
                            </label>
                            <div className="mt-2">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                />
                            </div>
                        </div>

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

                        {/* Wyświetlanie komunikatu sukcesu */}
                        {success && <p className="text-green-500 text-sm">{success}</p>}

                        {/* Przycisk rejestracji */}
                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Zarejestruj się
                            </button>
                        </div>
                    </form>

                    {/* Przycisk powrotu do strony logowania */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate("/login")}
                            className="text-indigo-600 hover:text-indigo-500 font-semibold"
                        >
                            Powrót do strony logowania
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;