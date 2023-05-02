
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: "stroller-stats.firebaseapp.com",
  projectId: "stroller-stats",
  storageBucket: "stroller-stats.appspot.com",
  messagingSenderId: "958011019232",
  appId: "1:958011019232:web:70b9bc995f933a4c782585",
  measurementId: "G-L9CK7DZZQH",
};

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
admin.initializeApp(firebaseConfig);

const db = admin.firestore();

const functions = require("firebase-functions");
const fetch = require("node-fetch");

const getRefreshToken = async (userId) => {
  return db.collection("users")
      .where("user_id", "==", userId)
      .limit(1)
      .get()
      .then((data) => {
        return data.docs[0].get("refresh_token");
      });
};

// TODO update db w/ new tokens?
const getAccessToken = async (refreshToken) => {
  return fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  }).then((res) => res.json()).then((res) => res.access_token);
};
const getLastActivity = async (accessToken, activityId) => {
  const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=false`, {
    headers: {authorization: `Bearer ${accessToken}`},
  });
  const data = await response.json();
  let isStroller = false;
  // eslint-disable-next-line max-len
  if (data["description"]) {
    isStroller = data["description"].toLowerCase().includes("strollerstats");
  }
  return {
    activity_id: data["id"],
    title: data["name"],
    distance: data["distance"],
    sport_type: data["sport_type"],
    start_date: data["start_date"],
    average_speed: data["average_speed"],
    user_id: data["athlete"]["id"],
    description: data["description"],
    is_stroller: isStroller,
  };
};

const addActivityToDB = (activityData) => {
  if (activityData.is_stroller &&
    (activityData.sport_type === "Run" || activityData.sport_type === "Walk")) {
    db.collection("activities").doc(activityData.activity_id.toString())
        .set(activityData).then(() => {
          functions.logger.info("Wrote to DB", activityData);
        });
  } else {
    // eslint-disable-next-line max-len
    functions.logger.info(`Skipped write to DB for ${activityData.activity_id} sport type ${activityData.sport_type}`);
  }
};

const retrieveMonthlyStrollerMiles = async (recentActivity) => {
  const userId = recentActivity.user_id;
  const sportType = recentActivity.sport_type;
  const date = new Date();
  const firstDayOfMonth = new Date(date.getFullYear(),
      date.getMonth(), 1).toISOString();
  const lastDayOfMonth = new Date(date.getFullYear(),
      date.getMonth() + 1, 0).toISOString();
  functions.logger.info("DATES", firstDayOfMonth, lastDayOfMonth);

  const activityRef = db.collection("activities")
      .where("user_id", "==", userId)
      .where("sport_type", "==", sportType)
      .where("start_date", ">=", firstDayOfMonth)
      .where("start_date", "<=", lastDayOfMonth)
      .where("is_stroller", "==", true);
  const activities = await activityRef.get();

  let totalMeters = 0;
  for (const doc of activities.docs) {
    const data = doc.data();
    totalMeters += data.distance;
  }
  const totalMiles = totalMeters * 0.000621371192; // Convert to miles
  functions.logger.info(`Got total miles ${totalMiles}`);

  return Math.round(totalMiles);
};

const updateDescription = async (recentActivity, accessToken) => {
  const description = recentActivity.description;
  // if already wrote, exit
  if (description.includes("StrollerStats.com -")) {
    return;
  }
  const activityId = recentActivity.activity_id;
  const totalMiles = await retrieveMonthlyStrollerMiles(recentActivity);
  // eslint-disable-next-line max-len
  const updatedDescription = description.concat("\n", `StrollerStats.com - ${totalMiles} stroller ${recentActivity.sport_type.toLowerCase()} miles so far this month`);
  const requestOptions = {
    method: "PUT",
    // eslint-disable-next-line max-len
    headers: {"authorization": `Bearer ${accessToken}`, "Content-Type": "application/json"},
    body: JSON.stringify({description: updatedDescription}),
  };
  fetch(`https://www.strava.com/api/v3/activities/${activityId}`, requestOptions).then((response) => {
    if (response.ok) {
      response.json().then((data) => {
        functions.logger.info("Updated description", data);
      });
    } else {
      // pass
    }
  }).catch((err) => {
    functions.logger.info(err);
  });
};

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

    const {owner_id: userId, object_id: activityId} = request.body;

    handlePost(userId, activityId).then(() => {
      response.status(200).send("Completed post handling.");
    });
  } else if (request.method === "GET") {
    const VERIFY_TOKEN = "STROLLER-STATS";
    const mode = request.query["hub.mode"];
    const token = request.query["hub.verify_token"];
    const challenge = request.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        functions.logger.info("Webhook verified");
        response.status(200).json({"hub.challenge": challenge});
      } else {
        response.sendStatus(403);
      }
    } else {
      response.sendStatus(403);
    }
  }
});

const handlePost = async (userId, activityId) => {
  const refreshToken = await getRefreshToken(userId);
  const accessToken = await getAccessToken(refreshToken);
  const recentActivity = await getLastActivity(accessToken, activityId);
  if (recentActivity.is_stroller) {
    addActivityToDB(recentActivity);
    updateDescription(recentActivity, accessToken);
  }
};

