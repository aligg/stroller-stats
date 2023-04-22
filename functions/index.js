const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
const {getRefreshToken} = require("./getRefreshToken.js");
admin.initializeApp();


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

    // handlePost(userId).then(() => {
    //   response.status(200).send("Completed post handling.");
    // });
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
  // const accessToken = await getAccessToken(refreshToken);
  // TODO: get latest activities and update db
};

