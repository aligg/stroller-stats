import React, { useContext } from "react";

import { UserData } from "../App";

const Home = (props) => {
    const {user, setUser} = useContext(UserData);

    // const [user, setUser] = React.useState(null)
    console.log("props", props)
    return (
        <div>
            <h1>Stroller Stats</h1>
        </div>
    );
};

export default Home;