import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { useData } from "../hooks/useData";
import Loading from "./Loading";


const AnnualStats = ({userId}) => {

    const currYear = new Date().getFullYear()
    

    const [data, dataLoading] = useData(userId, currYear)

    return (
    <>
        <h1>Annual Stroller Miles</h1>
            {dataLoading? <Loading/> : (
            <Tabs defaultIndex={1} onSelect={(index) => {console.log(index)}}>
                <TabList>
                    <Tab>Last year</Tab>
                    <Tab>{`${currYear}`}</Tab>
                </TabList>
                <TabPanel>Coming soon</TabPanel>
                <TabPanel>
                    <table>
                        <tbody>
                            <tr>
                                <th></th>
                            </tr>  
                            <tr>
                                <td>Total stroller run miles</td>
                                <td>{data["total_run_miles"].toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Total stroller walk miles</td>
                                <td>{data["total_walk_miles"].toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Average run pace with stroller</td>
                                <td>{data["average_run_speed"] === null ? "N/A" : `${data["average_run_speed"]} min/mile`}</td>
                            </tr>
                            <tr>
                                <td>Average walk pace with stroller</td>
                                <td>{data["average_walk_speed"] === null ? "N/A" : `${data["average_walk_speed"]} min/mile`}</td>
                            </tr>
                        </tbody>
                </table>
        </TabPanel>
        </Tabs>)}
    </>
    )
}

export default AnnualStats;