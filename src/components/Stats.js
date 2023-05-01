const Stats = ({data}) => {
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
        </tbody>
    </table>
    )
}

export default Stats;