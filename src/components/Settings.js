import { useEffect, useState } from "react";

const Settings = () => {

    const userId = localStorage.getItem("user_id");
    const [loading, setLoading] = useState(false)
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            setLoading(true);
            const response = await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/user/${userId}`)
            const data = await response.json();
            setChecked(data.opted_in_leaderboard || false)
            setLoading(false);
        }
        getUser()
    }, [userId])

    const updateUser = async (evt) => {
        setChecked(evt.target.checked)
        const optedIn = evt.target.checked;
        await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/update-user`, {method: "POST", headers: {
            "Content-Type": "application/json",
          }, body: JSON.stringify({user_id: Number(userId), opted_in_leaderboard: optedIn})})
    }

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
        <div>
            <h1>Settings</h1>
            <h2>Leaderboard</h2>
            <div className="leaderboard-toggle-container">
            <p style={{marginBlockEnd: 0, maxWidth: "60%"}}>Opt in to the leaderboard (coming soon!). This means that other users will see your first name and monthly mileage. </p>
            <div style={{display: "flex", alignItems: "center"}}>
                <label className="switch">
                    <input type="checkbox" onChange={updateUser} checked={checked}/>
                    <span className="slider round"></span>
                </label>
                <p style={{paddingLeft: "15px"}}>{loading ? "" : checked ? "On" : "Off"}</p>
            </div>
            </div>
            {/* <button disabled={!!loading }onClick={handleClick}>{loading? "Work in progress..." : "Sync data from previously this year."}</button> */}
        </div>
    )
}
export default Settings;