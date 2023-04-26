import React from "react";
import {useUser} from "../hooks/useUser"

const Home = () => {
    const { REACT_APP_CLIENT_ID } = process.env;
    const redirectUrl = "http://localhost:3000/redirect"
    const handleLogin = () => {
        window.location = `http://www.strava.com/oauth/authorize?client_id=${REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=${redirectUrl}/exchange_token&approval_prompt=force&scope=read,activity:read`;
    };

    const user_id = localStorage.getItem("user_id");
    const [user, loading] = useUser(user_id)
    
    if (user_id == null) {
        return (
            <div>
                <h1>Stroller Stats</h1>
                <button onClick={handleLogin}>Connect with Strava</button>
            </div>
        );
    }
    
    if (loading) {
        return (<div>Loading</div>)
    }
    
    
    else {
        return (<div>Hello {user.first_name} </div>)
    }
    
};

export default Home;