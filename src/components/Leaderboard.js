import 'react-tabs/style/react-tabs.css';

import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { useEffect, useState } from "react";

import Loading from "./Loading";
import { getDistance } from "../utils/getDistance";
import { getPreviousMonth } from '../utils/getPreviousMonth';

const LeaderboardTable = ({data, sport, optedInToKilometers}) => {
    const key = `${sport}_distance`
    const sortedData = data ? data.sort((a, b) => b[key] - a[key]).filter((obj) => {return obj[key] !== 0}) : [];
    const unitLabel = optedInToKilometers ? "Kilometers" : "Miles"

    return (
        <>
            <table>
                <tbody>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>{unitLabel}</th>
                    </tr>
                    {
                        sortedData.length === 0 && (<tr><td>No athletes on the board yet!</td></tr>)
                    }
                 {sortedData.map((obj, i) => {
                    const getMedal = (position) => {
                        if (position === 0) return '👑'; // Crown for 1st place
                        if (position === 1 || position === 2) return '🏆'; // Trophy for 2nd and 3rd
                        return '';
                    };

                    return (
                        <tr key={obj.first_name+i}>
                            <td>
                                <p style={{margin: 0, padding: 0}}>
                                    {i+1} {getMedal(i)}
                                </p>
                            </td>
                            <td><a href={`https://www.strava.com/athletes/${obj.user_id}`} target="_blank" rel="noreferrer">{obj.first_name}</a></td>
                            <td>{getDistance(obj[key], optedInToKilometers).toFixed(2)}</td>
                        </tr>
                    )
                })}      
                 </tbody>
            </table>
        </>
    );
}

const Leaderboard = ({userId, optedInToKilometers}) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({})
    const currMonth = new Date().toLocaleString('default', { month: 'long' })
    const lastMonth = getPreviousMonth();

    useEffect(() => {
        const retrieveData = async () => {
            setLoading(true);
            const response = await fetch("https://us-central1-stroller-stats.cloudfunctions.net/app/leaderboard")
            const data = await response.json();
            console.log(data)
            setData(data)
            setLoading(false);
        }
        retrieveData()
    }, []);
    
    return (
    <>
        <h1>Leaderboard</h1>
        <Tabs defaultIndex={3} onSelect={(index) => console.log(index)}>
        <TabList>
            <Tab>{lastMonth} Walk Leaderboard</Tab>
            <Tab>{lastMonth} Run Leaderboard</Tab>
            <Tab>{currMonth} Walk Leaderboard</Tab>
            <Tab>{currMonth} Run Leaderboard</Tab>
        </TabList>
            <TabPanel>{loading ? <Loading/> : <LeaderboardTable data={data.lastMonthData} sport="walk" optedInToKilometers={optedInToKilometers}/>}</TabPanel>
            <TabPanel>{loading ? <Loading/> : <LeaderboardTable data={data.lastMonthData} sport="run" optedInToKilometers={optedInToKilometers}/>}</TabPanel>
            <TabPanel>{loading ? <Loading/> : <LeaderboardTable data={data.currMonthData} sport="walk" optedInToKilometers={optedInToKilometers}/>}</TabPanel>
            <TabPanel>{loading ? <Loading/> : <LeaderboardTable data={data.currMonthData} sport="run" optedInToKilometers={optedInToKilometers}/>}</TabPanel>
        </Tabs>
            <p style={{textAlign: "right"}}>Please note that the leaderboard updates hourly. Opt in to the leaderboard in <a href="/settings">settings</a>.</p>
    </>)
}

export default Leaderboard;