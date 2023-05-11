const AnnualStats = ({data}) => {
    const year = new Date().getFullYear()

    return (
    <table>
        <tbody>
            <tr>
                <th>{year}</th>
            </tr>  
            <tr>
                <td>Total stroller run miles</td>
                <td>{Math.round(data["total_run_miles"])}</td>
            </tr>
            <tr>
                <td>Total stroller walk miles</td>
                <td>{Math.round(data["total_walk_miles"])}</td>
            </tr>
            <tr>
                <td>Average pace with stroller</td>
                <td>Coming soon</td>
            </tr>
        </tbody>
    </table>
    )
}

export default AnnualStats;