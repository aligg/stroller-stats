import About from "../components/About";
import AnnualStats from "../components/AnnualStats";
import Leaderboard from "../components/Leaderboard";
import Loading from "../components/Loading";
import MonthlyStats from "../components/MonthlyStats";
import React from "react";
import { useData } from "../hooks/useData";

const Home = () => {
    const { REACT_APP_CLIENT_ID } = process.env;
    const redirectUrl = process.env.NODE_ENV === "development"? "http://localhost:3000/redirect" : "http://strollerstats.com/redirect"
    const handleLogin = () => {
        window.location = `http://www.strava.com/oauth/authorize?client_id=${REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=${redirectUrl}/exchange_token&approval_prompt=force&scope=read,activity:read,activity:write`;
    };
    const user_id = localStorage.getItem("user_id");
    const [data, dataLoading] = useData(user_id)

    const renderContent = () => {
        if (user_id == null) {
            return (
                <div>
                    <About />
                    <button className="authButton" onClick={handleLogin}>
                        <img src="/strava-button.png"alt="Connect with Strava" />
                    </button>
                </div>
            );
        }

        else {
            return (
                <>
                    <p>{data && `Hey ${data.first_name}! 👋`}</p>
                    <AnnualStats data={data} loading={dataLoading}/>
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