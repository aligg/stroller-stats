import { BrowserRouter, Route, Routes } from "react-router-dom";

import React from "react";
import Redirect from "./routes/redirect";
import Root from "./routes/root";

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
                <Root />
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
