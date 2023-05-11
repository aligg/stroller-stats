import { useEffect, useState } from "react";

import Plot from 'react-plotly.js';
import { formatMonthData } from "../utils/formatMonthData";

const MonthlyStats = () => {
    const [loading, setLoading] = useState(false);
    const [months, setMonths] = useState([])
    const [runMiles, setRuns] = useState([])
    const [walkMiles, setWalks] = useState([])

    useEffect(() => {
        const retrieveData = async () => {
            setLoading(true);
            const response = await fetch("https://us-central1-stroller-stats.cloudfunctions.net/app/monthly-activities/3438509")
            const data = await response.json();
            const [months, runDistances, walkDistances] = formatMonthData(data)
            setMonths(months)
            setRuns(runDistances)
            setWalks(walkDistances)
            setLoading(false);
        }
        retrieveData()
    }, [])

    return (
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
          layout={ { title: 'Monthly Stroller Miles', xaxis: {title: "Month", type: "date", 'tickformat': '%b', tickmode: "array", tickvals: months}, yaxis: {title: "Miles", "tickformat": ".2f"}, hovermode: "x"} }
          config={{responsive: true}}
        />
    );


}

export default MonthlyStats;