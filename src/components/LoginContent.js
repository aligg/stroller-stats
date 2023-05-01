const LoginContent = () => {
    const { REACT_APP_CLIENT_ID } = process.env;
    const redirectUrl = "http://strollerstats.com/redirect"

    const handleLogin = () => {
        window.location = `http://www.strava.com/oauth/authorize?client_id=${REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=${redirectUrl}/exchange_token&approval_prompt=force&scope=read,activity:read,activity:write`;
    };

    return ( <div>
        <h1>Stroller Stats</h1>
        <button onClick={handleLogin}>Connect with Strava</button>
    </div>)
}

export default LoginContent;