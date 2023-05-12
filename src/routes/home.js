import About from "../components/About";
import AnnualStats from "../components/AnnualStats";
import MonthlyStats from "../components/MonthlyStats";
import React from "react";
import { useData } from "../hooks/useData";
import {useUser} from "../hooks/useUser"

const Home = () => {
    const { REACT_APP_CLIENT_ID } = process.env;
    const redirectUrl = process.env.NODE_ENV === "development"? "http://localhost:3000/redirect" : "http://strollerstats.com/redirect"
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
            return (<main>Loading</main>)
        }

        else {
            return (
                <>
                    <p>Hey {user.first_name}!👋</p>
                    <AnnualStats data={data} />
                    <MonthlyStats />
                    <p>More data coming soon!</p>
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