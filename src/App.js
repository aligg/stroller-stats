import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./routes/home";
import React from "react";
import Redirect from "./routes/redirect";

export const UserData = React.createContext();

export default function App() {
const [user, setUser] = React.useState(null)

  return (
    <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <UserData.Provider value={{user, setUser}}>
                <Home />
              </UserData.Provider>
            }
          />
          <Route path="/redirect/exchange_token" element={
            <UserData.Provider value={{user, setUser}}>
                <Redirect />
            </UserData.Provider>}
            />
        </Routes>
    </BrowserRouter>
  );
}
