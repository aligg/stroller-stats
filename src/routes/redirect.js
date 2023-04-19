import { parseAuthData } from '../utils.js/parseAuthData';
import { useEffect } from "react";
// import useAuthorization from "../hooks/useAuthorization"
import { useLocation } from 'react-router-dom';

const { REACT_APP_CLIENT_ID, REACT_APP_CLIENT_SECRET } = process.env;


const Redirect = () => {
    const location = useLocation();
    
    
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
            console.log(resp)
            const access_token = resp.access_token
            const refresh_token = resp.refresh_token
            const first_name = resp.athlete.firstname
            const user_id = resp.athlete.id
            
            console.log(access_token, refresh_token, first_name, user_id)
       }

    authenticate()
    }, [location.search])
    
    return (
        <div>Loading</div>
    )
}

export default Redirect;