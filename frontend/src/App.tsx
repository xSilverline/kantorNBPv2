
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import './App.css'

import Login from "./Login/Login.tsx";
import MainPage from "./MainPage/MainPage.tsx";


function App() {


    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage/>}/>
                <Route path="/login" element={<Login/>}/>
            </Routes>
        </Router>

    );
}
export default App
