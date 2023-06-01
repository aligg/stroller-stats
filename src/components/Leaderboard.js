import 'react-tabs/style/react-tabs.css';

import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { useEffect, useState } from "react";

import Loading from "./Loading";
import { getMiles } from "../utils/getMiles";
import { getPreviousMonth } from '../utils/getPreviousMonth';

const LeaderboardTable = ({data, sport}) => {
    const key = `${sport}_distance`
    const sortedData = data ? data.sort((a, b) => b[key] - a[key]) : [];
    return (
        <>
            <table>
                <tbody>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Miles</th>
                    </tr>
                    {sortedData.map((obj, i) => {
                        return (
                            <tr key={obj.first_name+i}>
                                <td>{i+1}</td>
                                <td>{obj.first_name}</td>
                                <td>{getMiles(obj[key]).toFixed(2)}</td>
                            </tr>
                        )
                    })}               
                 </tbody>
            </table>
        </>
    );
}

const Leaderboard = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({})
    const currMonth = new Date().toLocaleString('default', { month: 'long' })
    const lastMonth = getPreviousMonth();

    useEffect(() => {
        const retrieveData = async () => {
            setLoading(true);
            const response = await fetch("https://us-central1-stroller-stats.cloudfunctions.net/app/leaderboard")
            const data = await response.json();
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
            <TabPanel>{loading ? <Loading/> : <LeaderboardTable data={data.lastMonthData} sport="walk"/>}</TabPanel>
            <TabPanel>{loading ? <Loading/> : <LeaderboardTable data={data.lastMonthData} sport="run"/>}</TabPanel>
            <TabPanel>{loading ? <Loading/> : <LeaderboardTable data={data.currMonthData} sport="walk"/>}</TabPanel>
            <TabPanel>{loading ? <Loading/> : <LeaderboardTable data={data.currMonthData} sport="run"/>}</TabPanel>
        </Tabs>
            <p style={{textAlign: "right"}}>Want to opt into the leaderboard? Head over to <a href="/settings">settings</a>.</p><p style={{textAlign: "right"}}>Please note that the leaderboard updates a few times daily. Wonky numbers? This is a new feature that is in development - let me know about bugs please!</p>
    </>)
}

export default Leaderboard;