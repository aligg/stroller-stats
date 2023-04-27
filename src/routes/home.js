import React from "react";
import { useData } from "../hooks/useData";
import {useUser} from "../hooks/useUser"

const Home = () => {
    const { REACT_APP_CLIENT_ID } = process.env;
    const redirectUrl = "http://localhost:3000/redirect"
    const handleLogin = () => {
        window.location = `http://www.strava.com/oauth/authorize?client_id=${REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=${redirectUrl}/exchange_token&approval_prompt=force&scope=read,activity:read`;
    };

    const user_id = localStorage.getItem("user_id");
    const [user, loading] = useUser(user_id)
    const [data, dataLoading] = useData(user_id)
    console.log(data)

    const year = new Date().getFullYear()
    
    if (user_id == null) {
        return (
            <div>
                <h1>Stroller Stats</h1>
                <button onClick={handleLogin}>Connect with Strava</button>
            </div>
        );
    }
    
    if (loading || dataLoading) {
        return (<div>Loading</div>)
    }
    
    else {
        return (
            <div>
                <h1>Stroller Stats</h1>
                <p>Hey {user.first_name}!</p>
                <table>
                    <tbody>
                        <tr>
                            <th>{year}</th>
                        </tr>  
                        <tr>
                            <td>Total stroller run miles</td>
                            <td>{Math.round(data["total_run_miles"])}</td>
                        </tr>
                        <tr>
                            <td>Total stroller walk miles</td>
                            <td>{Math.round(data["total_walk_miles"])}</td>
                        </tr>
                    </tbody>
                </table>
            </div>)
    }
    
};

export default Home;