import React, { useContext } from "react";

import { UserData } from "../App";

const Root = () => {

    const { REACT_APP_CLIENT_ID } = process.env;
    const redirectUrl = "http://localhost:3000/redirect"

    const handleLogin = () => {
        window.location = `http://www.strava.com/oauth/authorize?client_id=${REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=${redirectUrl}/exchange_token&approval_prompt=force&scope=read`;
    };

    const {user, setUser} = useContext(UserData);
    console.log(user)
    if (user == null) {
        return (
            <div>
                <h1>Stroller Stats</h1>
                <button onClick={handleLogin}>Connect with Strava</button>
            </div>
        );
    } else {
        return (<div>hello {user.first_name}</div>)
    }
    
};

export default Root;