import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
    const navigate = useNavigate();

    const userId = localStorage.getItem("user_id");
    const [loading, setLoading] = useState(false)
    const [optedInToLeaderboard, setOptedInToLeaderboard] = useState(false);
    const [optedInToKilometers, setOptedInToKilometers] = useState(false);


    useEffect(() => {
        // enforce login
        if (!userId) {
            navigate("/")
        }
        const getUser = async () => {
            setLoading(true);
            const response = await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/user/${userId}`)
            const data = await response.json();
            setOptedInToLeaderboard(data.opted_in_leaderboard || false)
            setOptedInToKilometers(data.opted_in_kilometers || false)

            setLoading(false);
        }
        getUser()
    }, [navigate, userId])

    const updateUserLeaderboard = async (evt) => {
        setOptedInToLeaderboard(evt.target.checked)
        const optedIn = evt.target.checked;
        await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/update-user`, {method: "POST", headers: {
            "Content-Type": "application/json",
          }, body: JSON.stringify({user_id: Number(userId), opted_in_leaderboard: optedIn})})
    }

    const updateUserKms = async (evt) => {
        setOptedInToKilometers(evt.target.checked)
        const optedIn = evt.target.checked;
        await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/update-user`, {method: "POST", headers: {
            "Content-Type": "application/json",
          }, body: JSON.stringify({user_id: Number(userId), opted_in_kilometers: optedIn})})
    }


    // TODO: rate limit before launch
    // const handleClick = async () => {
    //     setLoading(true)
    //     const response = await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/sync-historical-data/${userId}`, {method: "POST", headers: {
    //         "Content-Type": "application/json",
    //       }, body: JSON.stringify({user_id: userId})})
    //     const data = await response.json();
    //     console.log(data)
    //     setLoading(false);
    // }

    return (
        <main>
            <h1>Settings</h1>
            <h2>Leaderboard</h2>
            <div className="toggle-container">
                <p style={{marginBlockEnd: 0, maxWidth: "60%"}}>Include me in the leaderboard. This means that other users will see your first name and monthly mileage. Optining into the leaderboard also makes you <a href="hall-of-fame">Hall of Fame</a> eligible</p>
                <div style={{display: "flex", alignItems: "center"}}>
                    <label className="switch">
                        <input type="checkbox" onChange={updateUserLeaderboard} checked={optedInToLeaderboard}/>
                        <span className="slider round"></span>
                    </label>
                    <p style={{paddingLeft: "15px"}}>{loading ? "" : optedInToLeaderboard ? "On" : "Off"}</p>
                </div>
            </div>
            <h2>Distance Units</h2>
            <div className="toggle-container">
                <p style={{marginBlockEnd: 0, maxWidth: "60%"}}>I prefer kilometers</p>
                <div style={{display: "flex", alignItems: "center"}}>
                    <label className="switch">
                        <input type="checkbox" onChange={updateUserKms} checked={optedInToKilometers}/>
                        <span className="slider round"></span>
                    </label>
                    <p style={{paddingLeft: "15px"}}>{loading ? "" : optedInToKilometers ? "On" : "Off"}</p>
                </div>
            </div>
            {/* <button disabled={!!loading }onClick={handleClick}>{loading? "Work in progress..." : "Sync data from previously this year."}</button> */}
        </main>
    )
}
export default Settings;