import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./routes/home";
import React from "react";
import Redirect from "./routes/redirect";

export default function App() {

  return (
    <BrowserRouter>
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
        </Routes>
    </BrowserRouter>
  );
}
