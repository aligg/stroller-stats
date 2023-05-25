
const Leaderboard = () => {
    return (<>
        <h1>Leaderboard</h1>
        <table>
            <tbody>
                <tr>
                    <th></th>
                </tr>  
                <tr>
                    <td>1</td>
                    <td>Ali</td>
                    <td>123</td>
                </tr>
                {/* <tr>
                    <td>Total stroller walk miles</td>
                    <td>{data["total_walk_miles"].toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Average run pace with stroller</td>
                    <td>{data["average_run_speed"]} min/mile</td>
                </tr>
                <tr>
                    <td>Average walk pace with stroller</td>
                    <td>{data["average_walk_speed"]} min/mile</td>
                </tr> */}
            </tbody>
        </table>
    </>)
}

export default Leaderboard;