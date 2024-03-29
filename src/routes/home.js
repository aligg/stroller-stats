import About from "../components/About";
import AnnualStats from "../components/AnnualStats";
import Leaderboard from "../components/Leaderboard";
import MonthlyStats from "../components/MonthlyStats";
import React from "react";

const Home = () => {
    const { REACT_APP_CLIENT_ID } = process.env;
    const redirectUrl = process.env.NODE_ENV === "development"? "http://localhost:3000/redirect" : "http://strollerstats.com/redirect"
    const handleLogin = () => {
        window.location = `http://www.strava.com/oauth/authorize?client_id=${REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=${redirectUrl}/exchange_token&approval_prompt=force&scope=read,activity:read,activity:write,activity:read_all`;
    };
    const user_id = localStorage.getItem("user_id");

    const renderContent = () => {
        if (user_id == null) {
            return (
                <div>
                    <About />
                    <button className="authButton" onClick={handleLogin}>
                        <img src="/strava-button.png" alt="Connect with Strava" />
                    </button>
                </div>
            );
        }

        else {
            return (
                <>
                    <AnnualStats userId={user_id} />
                    <MonthlyStats userId={user_id}/>
                    <Leaderboard />
                </>
            )
        }
    }

    return (
            <main>
                {renderContent()}
            </main>
        )
};

export default Home;