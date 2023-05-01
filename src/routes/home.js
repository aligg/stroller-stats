import About from "../components/About";
import Nav from "../components/Nav";
import React from "react";
import Stats from "../components/Stats";
import { useData } from "../hooks/useData";
import {useUser} from "../hooks/useUser"

const Home = () => {
    const { REACT_APP_CLIENT_ID } = process.env;
    const redirectUrl = "http://localhost:3000/redirect"
    const handleLogin = () => {
        window.location = `http://www.strava.com/oauth/authorize?client_id=${REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=${redirectUrl}/exchange_token&approval_prompt=force&scope=read,activity:read,activity:write`;
    };

    const user_id = localStorage.getItem("user_id");
    const [user, loading] = useUser(user_id)
    const [data, dataLoading] = useData(user_id)
    
    const renderContent = () => {
        if (user_id == null) {
            return (
                <div>
                    <About />
                    <button onClick={handleLogin}>Connect with Strava</button>
                </div>
            );
        }
        
        if (loading || dataLoading) {
            return (<div>Loading</div>)
        }

        else {
            return (
                <><p>Hey {user.first_name}!</p><Stats data={data} /></>
            )
        }
    }

    return (
        <div id="container">
            <Nav loggedIn={!!user_id}/>
            <main>
                {renderContent()}
            </main>
            <footer><p id="footer-text">❤️Made during naptime by <a href="https://github.com/aligg" target="_blank" rel="noreferrer">aligg</a></p></footer>
        </div>)
};

export default Home;