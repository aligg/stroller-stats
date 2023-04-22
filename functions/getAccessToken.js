exports.getAccessToken = async (refreshToken) => {
  return fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      client_id: process.env.REACT_APP_CLIENT_ID,
      client_secret: process.env.REACT_APP_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  }).then((res) => res.json()).then((res) => res.access_token);
};
