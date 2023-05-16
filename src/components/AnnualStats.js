const AnnualStats = ({data}) => {
    const year = new Date().getFullYear()

    return (
    <>
        <h1>{year} year to date</h1>
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
                        <td>Average pace with stroller</td>
                        <td>Coming soon</td>
                    </tr>
                </tbody>
        </table>
    </>
    )
}

export default AnnualStats;