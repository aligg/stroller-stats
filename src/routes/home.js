import React, { useEffect, useState } from "react"; // Import useEffect and useState
import About from "../components/About";
import AnnualStats from "../components/AnnualStats";
import Leaderboard from "../components/Leaderboard";
import MonthlyStats from "../components/MonthlyStats";
import Loading from "../components/Loading"; // Assuming you have a Loading component
import PreviewCarousel from "../components/PreviewCarousel";

const Home = () => {
    const { REACT_APP_CLIENT_ID } = process.env;
    const redirectUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000/redirect" : "http://strollerstats.com/redirect";
    const handleLogin = () => {
        window.location = `http://www.strava.com/oauth/authorize?client_id=${REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=${redirectUrl}/exchange_token&approval_prompt=force&scope=read,activity:read,activity:write,activity:read_all`;
    };
    const user_id = localStorage.getItem("user_id");

    const [optedInToKilometers, setOptedInToKilometers] = useState(null); // null initially, will be true/false after fetch
    const [loadingUserPreference, setLoadingUserPreference] = useState(true); // To indicate if user preference is being fetched

    useEffect(() => {
        const fetchUserPreference = async () => {
            if (user_id) {
                try {
                    setLoadingUserPreference(true);
                    const userResponse = await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/user/${user_id}`);
                    if (!userResponse.ok) {
                        throw new Error(`HTTP error! status: ${userResponse.status}`);
                    }
                    const userData = await userResponse.json();
                    setOptedInToKilometers(userData.opted_in_kilometers || false);
                } catch (error) {
                    console.error("Error fetching user preferences:", error);
                    setOptedInToKilometers(false);
                } finally {
                    setLoadingUserPreference(false);
                }
            } else {
                setLoadingUserPreference(false);
            }
        };

        fetchUserPreference();
    }, [user_id]);

    const renderContent = () => {
        if (user_id == null) {
            return (
                <div>
                    <About />
                    <button className="authButton" onClick={handleLogin}>
                        <img src="/btn_strava_connect_with_orange.png" alt="Connect with Strava" />
                    </button>
                    <h1>Connect with Strava to get started <div className="bounceArrow">^</div></h1>
                    {/* <PreviewCarousel /> */}
                </div>
            );
        } else {
            return (
                <>
                    <AnnualStats userId={user_id} />
                    {loadingUserPreference ? <Loading /> : <MonthlyStats userId={user_id} optedInToKilometers={optedInToKilometers} />}
                    {loadingUserPreference ? <Loading /> : <Leaderboard userId={user_id} optedInToKilometers={optedInToKilometers} />}
                </>
            );
        }
    };

    return (
        <main>
            {renderContent()}
        </main>
    );
};

export default Home;