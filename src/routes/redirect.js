import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from "../utils/api";
import { auth } from "../utils/firebase";
import { signInWithCustomToken } from "firebase/auth";

import Loading from "../components/Loading";
import { parseAuthData } from '../utils/parseAuthData';
import { useEffect, useState } from "react";

const Redirect = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [error, setError] = useState(false);

    useEffect(() => {
        const authenticate = async () => {
            try {
                const [code, scope] = parseAuthData(location.search) // find code in URL
                const response = await fetch(`${API_BASE}/auth/strava`, {method: "POST", headers: {
                    "Content-Type": "application/json",
                  }, body: JSON.stringify({code, scope})})
                if (!response.ok) {
                    throw new Error(`Sign-in failed with status ${response.status}`);
                }
                const { customToken } = await response.json()
                await signInWithCustomToken(auth, customToken)
                navigate("/", {state: "justLoggedIn"})
            } catch (e) {
                console.error("Error signing in: ", e);
                setError(true);
            }
       }
    authenticate()
    }, [location.search, navigate])
    
    if (error) {
        return (
            <main>
                <h2>Something went wrong connecting to Strava.</h2>
                <p><a href="/">Head home and try again</a>, or <a href="mailto:ali@strollerstats.com">let me know</a> if it keeps happening.</p>
            </main>
        )
    }

    return (
        <main><Loading/></main>
    )
}

export default Redirect;