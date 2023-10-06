import { useLocation, useNavigate } from 'react-router-dom';

import Loading from "../components/Loading";
import { parseAuthData } from '../utils/parseAuthData';
import { useEffect } from "react";

const { REACT_APP_CLIENT_ID, REACT_APP_CLIENT_SECRET } = process.env;


const Redirect = () => {
    const location = useLocation();
    const navigate = useNavigate();


    useEffect(() => {
        const authenticate = async () => {
            const [authToken, scopes] = parseAuthData(location.search) // find token in URL
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({client_id: REACT_APP_CLIENT_ID, client_secret: REACT_APP_CLIENT_SECRET, code: authToken, grant_type: 'authorization_code'})
            };
            const response = await fetch(`https://www.strava.com/api/v3/oauth/token`, requestOptions)
            const resp = await response.json()
            
            let user_id;
            let firstname;
            if (resp.athlete) {
                user_id = resp.athlete.id
                firstname = resp.athlete.firstname
                localStorage.setItem("user_id", `${resp.athlete.id}`);
            }             
            
            const userData = {
                user_id: user_id,
                access_token: resp.access_token, 
                refresh_token: resp.refresh_token,
                scopes: scopes,
                expires_at: resp.expires_at,
                first_name: firstname
            }
                                
            try {
                await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/create-user`, {method: "POST", headers: {"Content-Type": "application/json",
                }, body: JSON.stringify(userData)})
            } catch (e) {
                console.error("Error adding user: ", e);
            }
            navigate("/", {state: "justLoggedIn"})
       }
    authenticate()
    }, [location.search, navigate])
    
    return (
        <main><Loading/></main>
    )
}

export default Redirect;