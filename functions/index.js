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

/**
 * Retrieve refresh token from the db
 * @param {number} userId
 * @return {number}
 */
const getRefreshToken = async (userId) => {
  return db.collection("users")
      .where("user_id", "==", userId)
      .limit(1)
      .get()
      .then((data) => {
        return data.docs[0].get("refresh_token");
      });
};

/**
 * Call to Strava to get a fresh access token
 * @param {number} refreshToken
 * @return {number}
 */
const getAccessToken = async (refreshToken) => {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    })});
  const data = await response.json();
  return data.access_token;
};

const formatActivity = (data) => {
  let isStroller = false;
  // eslint-disable-next-line max-len
  if (data["description"]) {
    isStroller = data["description"].toLowerCase().includes("strollerstats") || data["description"].toLowerCase().includes("strollermiles");
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

const getActivity = async (accessToken, activityId) => {
  const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=false`, {
    headers: {authorization: `Bearer ${accessToken}`},
  });
  const data = await response.json();
  const activity = formatActivity(data);

  return activity;
};

const addActivityToDB = async (activityData) => {
  if (activityData.is_stroller &&
    (activityData.sport_type === "Run" || activityData.sport_type === "Walk")) {
    await db.collection("activities").doc(activityData.activity_id.toString())
        .set(activityData).then(() => {
          functions.logger.info("Wrote to DB", activityData);
        });
    return 1;
  } else {
    // eslint-disable-next-line max-len
    functions.logger.info(`Skipped write to DB for ${activityData.activity_id} sport type ${activityData.sport_type}`);
    return 0;
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
      functions.logger.info("potential problem with write to description.");
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
  const recentActivity = await getActivity(accessToken, activityId);
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

const getBeginningOfYearTimestamp = () => {
  const now = new Date(); // Get the current date
  const year = now.getFullYear(); // Get the current year
  const beginningOfYear = new Date(year, 0, 1); // Create a new Date object for January 1st of the current year
  const timestamp = Math.floor(beginningOfYear.getTime() / 1000); // Get the epoch timestamp by dividing the milliseconds by 1000

  return timestamp;
};

app.post("/create-user", async (request, response) => {
  const userId = request.body.user_id;

  const userData = {
    user_id: userId,
    access_token: request.body.access_token,
    refresh_token: request.body.refresh_token,
    scopes: request.body.scopes,
    expires_at: request.body.expires_at,
    first_name: request.body.first_name,
  };

  await db.collection("users").doc(userId.toString())
      .set(userData).then(() => {
        functions.logger.info("Wrote user to DB", userData);
      });
  response.status(200).send("wrote");
});

/** TODO: below got super hacky - clean up and add tests */
app.post("/sync-historical-data/:user_id", async (request, res) => {
  const userId = Number(request.body.user_id);
  const refreshToken = await getRefreshToken(userId);
  const accessToken = await getAccessToken(refreshToken);
  const begOfYear = getBeginningOfYearTimestamp();
  const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${begOfYear}&per_page=20`, {
    headers: {authorization: `Bearer ${accessToken}`},
  });
  const data = await response.json();
  const firstActivity = data[0]["start_date"];
  const lastActivity = data[data.length - 1]["start_date"];

  // This doesn't update because the loop below is async.
  let writes = 0;
  data.forEach((activity) => {
    const activityId = activity["id"].toString();
    db.collection("activities").doc(activityId).get().then((doc) => {
      if (doc.exists) {
        functions.logger.info("Write skipped, doc already exists in database");
      } else {
        // Ping Strava API again b/c list API doesn't include description
        getActivity(accessToken, activityId).then((activityWithDescription) => {
          // if stroller handle side effects
          if (activityWithDescription.is_stroller) {
            functions.logger.info("GOT IN with stroller");
            addActivityToDB(activityWithDescription).then((added) => {
              writes += added;
              updateDescription(activityWithDescription, accessToken);
              functions.logger.info("writes now", writes);
            }).then(() => {
              functions.logger.info("writes now miau", writes);
            });
          }
        });
      }
    });
    // const doc = await db.collection("activities").doc(activityId).get();
    // if (doc.exists) {
    //   functions.logger.info("Write skipped, doc already exists in database");
    // } else {
    //   // Ping Strava API again b/c list API doesn't include description
    //   const activityWithDescription = await getActivity(accessToken, activityId);
    //   // if stroller handle side effects
    //   if (activityWithDescription.is_stroller) {
    //     functions.logger.info("GOT IN with stroller");
    //     const added = await addActivityToDB(activityWithDescription);
    //     functions.logger.info("ADDED value", added);
    //     writes += added;
    //     await updateDescription(activityWithDescription, accessToken);
    //     functions.logger.info("writes now", writes);
    //   }
    // }
  });
  res.status(200).send(JSON.stringify({writes: writes, activities_length: data.length, start_date: firstActivity, end_date: lastActivity}));
});

exports.app = functions.https.onRequest(app);
