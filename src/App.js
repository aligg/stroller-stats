import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import About from "./components/About";
import Footer from "./components/Footer";
import Home from "./routes/home";
import Nav from "./components/Nav";
import React from "react";
import RedirectComponent from "./routes/redirect";
import Settings from "./components/Settings";

export default function App() {
  const user_id = localStorage.getItem("user_id");
  console.log(user_id)
  return (
    <BrowserRouter>
    <div id="container">
    <Nav loggedIn={!!user_id}/>
        <Routes>
          <Route
            path="/"
            element={
                <Home />
            }
          />
            <Route path="/redirect/exchange_token" element={
                <RedirectComponent />
            }
            />
           <Route
            path="/about"
            element={
                <About />
            }
          />
           <Route
            path="/settings"
            element={
                <Settings />
            }
          />
          <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
        <Footer />
        </div>
    </BrowserRouter>
  );
}
