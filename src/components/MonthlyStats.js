import { useEffect, useState } from "react";

import Loading from "./Loading";
import Plot from 'react-plotly.js';
import { PropTypes } from "prop-types";
import React from "react";
import { formatMonthData } from "../utils/formatMonthData";
  

const MonthlyStats = ({userId, optedInToKilometers}) => {
    const [loading, setLoading] = useState(false);
    const [months, setMonths] = useState([])
    const [runMiles, setRuns] = useState([])
    const [walkMiles, setWalks] = useState([])
    const [oneYear, setOneYear] = useState(true)
    const unitLabel = optedInToKilometers ? "kilometer" : "mile"

    useEffect(() => {
        const retrieveData = async () => {
            setLoading(true);
            const response = await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/monthly-activities/${userId}`)
            const data = await response.json();
            
            const [months, runDistances, walkDistances] = formatMonthData(data, optedInToKilometers)
            setMonths(months)
            setRuns(runDistances)
            setWalks(walkDistances)
            
            setLoading(false);
        }
        retrieveData()
    }, [userId])

    const data = [
        {
        x: oneYear ? months.slice(-12) : months,
        y: oneYear ? runMiles.slice(-12) : runMiles,
        type: 'scatter',
        name: `Run ${unitLabel}s`,
        mode: 'lines+markers',
        marker: {color: '#03045e'},
        line: {color: "#03045e", width: 3}
        },
        {
            x: oneYear ? months.slice(-12) : months,
            y: oneYear ? walkMiles.slice(-12) : walkMiles,
            type: 'scatter',
            name: `Walk ${unitLabel}s`,
            mode: 'lines+markers',
            marker: {color: "#00f5d4"},
            line: {color: "#00f5d4", width: 3}
        },
    ]

    const layout = { 
        font: {family: "Inter", color: "black"}, 
        font_color: "black", 
        dragmode: false, 
        xaxis: {
            type: "date", 'tickformat': '%b', tickmode: "array", tickvals: months}, 
        yaxis: {visible: true, hoverformat: ".2f"}, 
        hovermode: "x", 
        tickformat: ".0f",
        legend: {
            orientation: "h"
        }, 
        margin: { r: 0, l: 15, t: 0}
    }

    return (
        <>
            <h1>{`Monthly stroller ${unitLabel}s`}</h1>
            {loading ? <Loading /> :
            <>
              {months.length > 12 && (
                  <div style={{display: "flex", alignItems: "center", justifyContent:"flex-end"}}>
                <label className="switch">
                    <input type="checkbox" onChange={() => setOneYear(!oneYear)} checked={oneYear}/>
                    <span className="slider round"></span>
                </label>
                <p style={{paddingLeft: "15px"}}>{oneYear ? "1y" : "all"}</p>
            </div>)}
            <Plot  
                data={data}
                layout={layout}
                useResizeHandler={true}
                style={{width: "100%"}}
                config={{displayModeBar: false}}
            /></>}
        </>
    );
}

MonthlyStats.propTypes = {
    userId: PropTypes.string.isRequired,
}

export default MonthlyStats;

