import { doc, setDoc } from "firebase/firestore";
// import useAuthorization from "../hooks/useAuthorization"
import { useLocation, useNavigate } from 'react-router-dom';

import {db} from '../utils/firebase'
import { parseAuthData } from '../utils/parseAuthData';
import { useEffect } from "react";

const { REACT_APP_CLIENT_ID, REACT_APP_CLIENT_SECRET } = process.env;


const Redirect = () => {
    const location = useLocation();
    const navigate = useNavigate();

    
    
    useEffect(() => {
        
        
        const authenticate = async () => {
            const [authToken, scope] = parseAuthData(location.search) // find token in URL
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'React Hooks POST Request Example' })
            };

            
            const response = await fetch(`https://www.strava.com/api/v3/oauth/token?client_id=${REACT_APP_CLIENT_ID}&client_secret=${REACT_APP_CLIENT_SECRET}&code=${authToken}&grant_type=authorization_code`, requestOptions)
            const resp = await response.json()
            const access_token = resp.access_token
            const refresh_token = resp.refresh_token
            const first_name = resp.athlete.firstname
            const user_id = resp.athlete.id
            const expires_at = resp.expires_at
            
            try {
                await setDoc(doc(db, "users", `${user_id}`), {
                    access_token: access_token, 
                    refresh_token: refresh_token,
                    scopes: scope,
                    expires_at: expires_at,
                    first_name: first_name
                })
                console.log("User written with ID: ", user_id);
                } catch (e) {
                console.error("Error adding user: ", e);
                }
        
       }

    authenticate()
    }, [location.search, navigate])
    
    return (
        <div>Loading</div>
    )
}

export default Redirect;