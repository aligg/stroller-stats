/* eslint-disable max-len */

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
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const db = admin.firestore();
const express = require("express");
const app = express();
const cors = require("cors")({origin: true});
app.use(cors);


const getRefreshToken = async (userId) => {
  return db.collection("users")
      .where("user_id", "==", userId)
      .limit(1)
      .get()
      .then((data) => {
        return data.docs[0].get("refresh_token");
      });
};

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
    isStroller = data["description"].toLowerCase().includes("strollerstats") || data["description"].toLowerCase().includes("strollermiles");
  }
  functions.logger.info("IN GET LAST", data["description"], isStroller);

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

const addActivityToDB = async (activityData) => {
  if (activityData.is_stroller &&
    (activityData.sport_type === "Run" || activityData.sport_type === "Walk")) {
    await db.collection("activities").doc(activityData.activity_id.toString())
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
  const date = new Date(recentActivity.start_date);
  const firstDayOfMonth = new Date(date.getFullYear(),
      date.getMonth(), 1).toISOString();
  const lastDayOfMonth = new Date(date.getFullYear(),
      date.getMonth() + 1, 0).toISOString();

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
  const roundedTotalMiles = totalMiles.toFixed(2);
  functions.logger.info(`Got total miles ${roundedTotalMiles}`);

  return roundedTotalMiles;
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
    await addActivityToDB(recentActivity);
    updateDescription(recentActivity, accessToken);
  }
};

app.get("/monthly-activities/:user_id", async (request, res) => {
  const userId = request.params.user_id;
  const snapshot = await admin.firestore().collection("activities").where("user_id", "==", Number(userId)).get();
  const monthlyData = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    functions.logger.info("data", data);
    const startDate = new Date(data.start_date);
    const month = startDate.getMonth() + 1;
    const year = startDate.getFullYear();
    const monthIdentifier = `${year}-${month}`;
    const existingObject = monthlyData.find((obj) => obj.month === monthIdentifier);
    if (existingObject) {
      const key = `${data.sport_type.toLowerCase()}_distance`;
      existingObject[key] += data.distance;
    } else {
      let newObject ={};
      if (data.sport_type === "Run") {
        newObject = {month: monthIdentifier, run_distance: data.distance, walk_distance: 0};
      } else {
        newObject = {month: monthIdentifier, run_distance: 0, walk_distance: data.distance};
      }
      monthlyData.push(newObject);
    }
  });
  res.status(200).send(JSON.stringify(monthlyData));
});

exports.app = functions.https.onRequest(app);
