import { BrowserRouter, Route, Routes } from "react-router-dom";

import About from "./components/About";
import Footer from "./components/Footer";
import Home from "./routes/home";
import Nav from "./components/Nav";
import React from "react";
import Redirect from "./routes/redirect";

export default function App() {

  const user_id = localStorage.getItem("user_id");


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
                <Redirect />
            }
            />
           <Route
            path="/about"
            element={
                <About />
            }
          />
        </Routes>
        <Footer />
        </div>
    </BrowserRouter>
  );
}
