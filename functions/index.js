const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

const getRefreshToken = async (userId) => {
  return db.collection("users").where("id", "==", userId).limit(1).get()
      .then((data) => data.docs[0].get("refresh_token"));
};

const getAccessToken = async (refreshToken) => {
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

const getLastActivity = async (accessToken, userId) => {
  console.log(accessToken, userId)
}

/**
 * Webhooks - the GET method must respond to an initial request to create
 * the subscription. See: https://developers.strava.com/docs/webhooks/
 *
 * I ran creation request from the command line after deploying the GET portion
 *
 */
exports.stravaWebhook = functions.https.onRequest((request, response) => {
  if (request.method === "POST") {
    functions.logger.info("Received webhook event", {
      query: request.query,
      body: request.body,
    });

    const {owner_id: userId} = JSON.parse(request.body);

    handlePost(userId).then(() => {
      response.status(200).send("Completed post handling.");
    });
  } else if (request.method === "GET") {
    const VERIFY_TOKEN = "STROLLER-STATS";
    const mode = request.query["hub.mode"];
    const token = request.query["hub.verify_token"];
    const challenge = request.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        functions.logger.info("WEBHOOK_VERIFIED");
        response.status(200).json({"hub.challenge": challenge});
      } else {
        response.sendStatus(403);
      }
    } else {
      response.sendStatus(403);
    }
  }
});

const handlePost = async (userId) => {
  const refreshToken = await getRefreshToken(userId);
  const accessToken = await getAccessToken(refreshToken);
  const recentActivity = await getLastActivity(accessToken, userId)
  // TODO: get latest activities and update db
};

