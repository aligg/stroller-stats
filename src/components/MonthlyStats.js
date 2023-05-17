import { useEffect, useState } from "react";

import Loading from "./Loading";
import Plot from 'react-plotly.js';
import { formatMonthData } from "../utils/formatMonthData";

const MonthlyStats = ({userId}) => {
    const [loading, setLoading] = useState(false);
    const [months, setMonths] = useState([])
    const [runMiles, setRuns] = useState([])
    const [walkMiles, setWalks] = useState([])

    useEffect(() => {
        const retrieveData = async () => {
            setLoading(true);
            const response = await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/monthly-activities/${userId}`)
            const data = await response.json();
            const [months, runDistances, walkDistances] = formatMonthData(data)
            setMonths(months)
            setRuns(runDistances)
            setWalks(walkDistances)
            setLoading(false);
        }
        retrieveData()
    }, [userId])

    return (
        <>
            <h1>Monthly stroller miles</h1>
            {loading ? <Loading /> :
            <Plot  data={[
                {
                x: months,
                y: runMiles,
                type: 'scatter',
                name: "Run miles",
                mode: 'lines+markers',
                marker: {color: '#03045e'},
                line: {color: "#03045e", width: 3}
                },
                {
                    x: months,
                    y: walkMiles,
                    type: 'scatter',
                    name: "Walk miles",
                    mode: 'lines+markers',
                    marker: {color: "#00f5d4"},
                    line: {color: "#00f5d4", width: 3}
                },
            ]}
            layout={ { font: {family: "Inter", color: "black"}, font_color: "black", dragmode: false, xaxis: {type: "date", 'tickformat': '%b', tickmode: "array", tickvals: months}, yaxis: {title: "Stroller Miles", "tickformat": ".2f"}, hovermode: "x", legend: {
            orientation: "h"
            }, margin: {l: 0, r: 0}} }
            useResizeHandler={true}
            style={{width: "100%"}}
            config={{displayModeBar: false}}
            />}
        </>
    );


}

export default MonthlyStats;