import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import About from "./components/About";
import Footer from "./components/Footer";
import Home from "./routes/home";
import Nav from "./components/Nav";
import RedirectComponent from "./routes/redirect";
import React, { Suspense, lazy } from "react";
import Loading from "./components/Loading";
import { AuthProvider, useAuth } from "./utils/auth";

const Settings = lazy(() => import("./components/Settings"));
const HallOfFame = lazy(() => import("./components/HallOfFame"));

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  return (
    <BrowserRouter>
    <div id="container">
    <Nav loggedIn={!!user}/>
        <Suspense fallback={<Loading />}>
        {loading ? <Loading /> : (
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
             <Route
            path="/hall-of-fame"
            element={
                <HallOfFame />
            }
          />
          <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
        )}
        </Suspense>
        <Footer />
        </div>
    </BrowserRouter>
  );
}
