import { useEffect, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import Loading from "./Loading";
import { authFetch } from "../utils/api";


const startYear = 2023;

const getAffirmation = (name) => {
    const affirmations = [`✨Nice work ${name}✨!`, `📈All the miles📈`, `💃🏽${name}, look at you go💃🏽`, `✨Amazing work ${name}✨!`, `✨Inspirational work ${name}✨!`, `✨Iconic work ${name}✨!`, `💅${name} let's be real - more miles than your spouse amiright?💅`, `🙇The way you did that🙇`]
    return affirmations[(Math.floor(Math.random() * affirmations.length))]
}

const generateTabsForEachYear = () => {
    const currYear = new Date().getFullYear()

   let resp = []

    for (let year = startYear; year <= currYear; year++) {
        resp.push(<Tab key={year}>{year}</Tab>)
    }
    return resp
}

const AnnualStats = ({userId}) => {
    const [index, setIndex] = useState((new Date().getFullYear() - startYear))
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const currYear = startYear + index
    const distanceLabel = data ? data["distance_unit"] : ""

    useEffect(() => {
        if (!userId) {
            return;
        }
        // Ignore responses for a year the user has already tabbed away from.
        let ignore = false;

        const getData = async () => {
            setLoading(true)
            setError(false)
            try {
                const response = await authFetch(`/me/activity-data/${currYear}`)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (!ignore) setData(data)
            } catch (e) {
                console.error("Error fetching annual stats:", e);
                if (!ignore) setError(true)
            } finally {
                if (!ignore) setLoading(false)
            }
        }

        getData()
        return () => { ignore = true; }
    }, [userId, currYear]);

    const renderTabPanelContent = () => {

        if (error) {
            return <p>Couldn't load your stats. Try refreshing the page.</p>
        }
        if (loading || data === null) {
            return <Loading/>
        }
        return (
            <table>
                        <tbody>
                            <tr>
                                <th>{getAffirmation(data.first_name)}</th>
                            </tr>  
                            <tr>
                                <td>{`Total stroller run ${distanceLabel}s`}</td>
                                <td>{data["total_run_distance"].toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>{`Total stroller walk ${distanceLabel}s`}</td>
                                <td>{data["total_walk_distance"].toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>{`Total pack ${distanceLabel}s`}</td>
                                <td>{data.total_pack_distance.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Average run pace with stroller</td>
                                <td>{data["average_run_speed"] === null ? "N/A" : `${data["average_run_speed"]} min/${distanceLabel}`}</td>
                            </tr>
                            <tr>
                                <td>Average walk pace with stroller</td>
                                <td>{data["average_walk_speed"] === null ? "N/A" : `${data["average_walk_speed"]} min/${distanceLabel}`}</td>
                            </tr>
                        </tbody>
                </table>
        )
    }

    const generateTabContentForEachYear = () => {
        const currYear = new Date().getFullYear()

    let resp = []

        for (let year = startYear; year <= currYear; year++) {
            resp.push(<TabPanel key={year}>                  
                {renderTabPanelContent()}
            </TabPanel>)
        }
        return resp
    }

    return (
    <>
        {!loading && data && <h1>{`Annual stroller ${distanceLabel}s`}</h1>}
            <Tabs defaultIndex={index} onSelect={(index) => {setIndex(index)}}>
                <TabList>
                    {generateTabsForEachYear()}
                </TabList>
                {generateTabContentForEachYear()}
        </Tabs>
    </>
    )
}

export default AnnualStats;