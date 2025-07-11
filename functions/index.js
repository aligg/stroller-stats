/* eslint-disable max-len */

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
const {applicationDefault} = require("firebase-admin/app");

const {getAuth} = require("firebase-admin/auth");
const {writeMonthlyData} = require("./monthlyData");


const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: "stroller-stats.firebaseapp.com",
  projectId: "stroller-stats",
  storageBucket: "stroller-stats.appspot.com",
  messagingSenderId: "958011019232",
  appId: "1:958011019232:web:70b9bc995f933a4c782585",
  measurementId: "G-L9CK7DZZQH",
  credential: applicationDefault(),
};
let firebaseApp;
if (!admin.apps.length) {
  firebaseApp = admin.initializeApp(firebaseConfig);
}
const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {logger} = require("firebase-functions");
const fetch = require("node-fetch");
const db = admin.firestore();
const express = require("express");
const app = express();
const cors = require("cors")({origin: true});

// Constants
const STROLLER_STATS_URL = "https://www.strollerstats.com";
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
 * @param {string} grantType
 * @return {number}
 */
const getAccessToken = async (refreshToken, grantType) => {
  const params = {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type: grantType,
  };
  if (grantType === "refresh_token") {
    params.refresh_token = refreshToken;
  } else {
    params.code = refreshToken;
  }
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(params)});
  const data = await response.json();
  return data;
};

const getPartialDistance = (text) => {
  const regex = /#?(?:strollerstats|strollermiles)\(([0-9.]+)\)/i;
  const match = text.match(regex);

  if (match !== null && !isNaN(Number(match[1]))) {
    logger.info(`GOT PARTIAL as ${Number(match[1])}`);
    return Number(match[1]);
  }

  return null;
};


const formatActivity = (data, isKilometersUser) => {
  let isStroller = false;
  if (data["description"]) {
    isStroller = data["description"].toLowerCase().includes("strollerstats") || data["description"].toLowerCase().includes("strollermiles");
  } else {
    if (data["name"]) {
      isStroller = data["name"].toLowerCase().includes("strollerstats") || data["name"].toLowerCase().includes("strollermiles");
    }
  }
  logger.info(`Evaluated isStroller as: ${isStroller} for activity titled: ${data["name"]}`);

  const partialDistance = getPartialDistance(data["description"]);
  let distance = data["distance"];
  if (partialDistance !== null) {
    // partialDistance is in miles or kilometers
    if (getMeters(partialDistance, isKilometersUser) < distance) {
      distance = getMeters(partialDistance, isKilometersUser);
    }
  }

  return {
    activity_id: data["id"],
    title: data["name"],
    distance: distance,
    sport_type: data["sport_type"],
    start_date: data["start_date"],
    average_speed: data["average_speed"],
    user_id: data["athlete"]["id"],
    description: data["description"],
    is_stroller: isStroller,
  };
};

const getActivity = async (accessToken, activityId, isKilometersUser) => {
  logger.info("top of get Activity");
  const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=false`, {
    headers: {authorization: `Bearer ${accessToken}`},
  });
  const data = await response.json();

  const activity = formatActivity(data, isKilometersUser);

  return activity;
};

const addActivityToDB = async (activityData) => {
  if (activityData.is_stroller &&
    (activityData.sport_type === "Run" || activityData.sport_type === "Walk")) {
    await db.collection("activities").doc(activityData.activity_id.toString())
        .set(activityData).then(() => {
          logger.info("Wrote to DB", activityData);
        });
    return 1;
  } else {
    // eslint-disable-next-line max-len
    logger.info(`Skipped write to DB for ${activityData.activity_id} sport type ${activityData.sport_type}`);
    return 0;
  }
};

const retrieveMonthlyStrollerDistance = async (recentActivity, isKilometersUser = false) => {
  const userId = recentActivity.user_id;
  const sportType = recentActivity.sport_type;
  const date = new Date(recentActivity.start_date);
  const startOfMonth = new Date(date.getFullYear(),
      date.getMonth(), 1).toISOString();
  const startOfNextMonth = new Date(date.getFullYear(),
      date.getMonth() + 1, 1).toISOString();

  const activityRef = db.collection("activities")
      .where("user_id", "==", userId)
      .where("sport_type", "==", sportType)
      .where("start_date", ">=", startOfMonth)
      .where("start_date", "<", startOfNextMonth)
      .where("is_stroller", "==", true);
  const activities = await activityRef.get();

  let totalMeters = 0;
  for (const doc of activities.docs) {
    const data = doc.data();
    totalMeters += data.distance;
  }
  const totalDistance = getDistance(totalMeters, isKilometersUser);
  const roundedTotalDistance = totalDistance.toFixed(2);
  logger.info(`Got total distance ${roundedTotalDistance}. isKilometers: ${isKilometersUser}`);

  return roundedTotalDistance;
};

/**
 * Check if an activity description has already been processed by StrollerStats
 * @param {string} description - The activity description to check
 * @return {boolean} - True if already processed, false otherwise
 */
const isAlreadyProcessed = (description) => {
  if (!description) return false;

  const alreadyProcessedMarkers = [
    "StrollerStats.com -",
    "| StrollerStats",
    "| strollerstats",
    `| ${STROLLER_STATS_URL}`,
  ];

  return alreadyProcessedMarkers.some((marker) => {
    return description.includes(marker);
  });
};

const updateDescription = async (recentActivity, accessToken) => {
  const description = recentActivity.description;

  // if already wrote, exit
  if (isAlreadyProcessed(description)) {
    return;
  }
  const userId = recentActivity.user_id;
  const isKilometersUser = await getIsKilometersUser(userId);
  const distanceUnit = isKilometersUser ? "kilometers" : "miles";
  const activityId = recentActivity.activity_id;
  const totalDistance = await retrieveMonthlyStrollerDistance(recentActivity, isKilometersUser);
  const currMonth = new Date(recentActivity.start_date).toLocaleString("default", {month: "long"});
  // eslint-disable-next-line max-len
  const updatedDescription = description.concat("\n", `${totalDistance} ${currMonth} stroller ${recentActivity.sport_type.toLowerCase()} ${distanceUnit} | ${STROLLER_STATS_URL}`);
  const requestOptions = {
    method: "PUT",
    // eslint-disable-next-line max-len
    headers: {"authorization": `Bearer ${accessToken}`, "Content-Type": "application/json"},
    body: JSON.stringify({description: updatedDescription}),
  };
  fetch(`https://www.strava.com/api/v3/activities/${activityId}`, requestOptions).then((response) => {
    if (response.ok) {
      response.json().then((data) => {
        logger.info("Updated description", data);
      });
    } else {
      // pass
      logger.info("potential problem with write to description.");
    }
  }).catch((err) => {
    logger.info(err);
  });
};

/**
 * Webhooks - the GET method must respond to an initial request to create
 * the subscription. See: https://developers.strava.com/docs/webhooks/
 *
 * I ran creation request from the command line after deploying the GET portion
 *
 */
exports.stravaWebhookv2 = onRequest((request, response) => {
  if (request.method === "POST") {
    logger.info("Received webhook event", {
      query: request.query,
      body: request.body,
    });
    logger.info("Got here");
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
        logger.info("Webhook verified");
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
  const accessResp = await getAccessToken(refreshToken, "refresh_token");
  const isKilometersUser = await getIsKilometersUser(userId);
  const recentActivity = await getActivity(accessResp.access_token, activityId, isKilometersUser);
  logger.info(recentActivity);
  if (recentActivity.is_stroller) {
    await addActivityToDB(recentActivity);
    updateDescription(recentActivity, accessResp.access_token);
  }
};
/**
 *
 * @param {*} meters
 * @param {*} isKilometersUser
 * @return {number} units in miles or kilometers per user preference
 */
const getDistance = (meters, isKilometersUser = false) =>{
  if (isKilometersUser) {
    return meters / 1000;
  }
  return meters * 0.000621371192;
};

const getMeters = (distance, isKilometersUser = false) => {
  if (isKilometersUser) {
    return distance * 1000;
  }
  return distance * 1609.344;
};

const getUser = async (userId) => {
  return db.collection("users")
      .where("user_id", "==", Number(userId))
      .limit(1)
      .get()
      .then((data) => {
        return data.docs[0];
      });
};

const getUserName = async (userId) => {
  return db.collection("users")
      .where("user_id", "==", Number(userId))
      .limit(1)
      .get()
      .then((data) => {
        return data.docs[0].get("first_name");
      });
};

const getIsKilometersUser = async (userId) => {
  try {
    const userDoc = await db.collection("users")
        .where("user_id", "==", Number(userId))
        .where("opted_in_kilometers", "==", true)
        .limit(1)
        .get();

    if (userDoc.empty) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    logger.info("Error checking kilometers opt-in status:", error);
    return false;
  }
};

app.get("/user/:user_id", async (request, res) => {
  const userId = request.params.user_id;
  logger.info(userId);
  const doc = await getUser(userId);
  logger.info("doc", doc);
  const data = await doc.data();
  logger.info("Data", data);
  res.status(200).send(JSON.stringify(data));
});

app.post("/get-access-token/", async (request, res) => {
  const refreshToken = request.body.request_token;
  const accessResp = await getAccessToken(refreshToken, "authorization_code");
  res.status(200).send(accessResp);
});

app.post("/update-user/", async (request, res) => {
  const userId = request.body.user_id;

  const userData = request.body;

  await db.collection("users").doc(userId.toString())
      .update(userData).then(() => {
        logger.info("Wrote user update to DB", userData);
      });
  res.status(200).send({"updated_user": userId});
});

app.get("/user-activity-data/:user_id/:year", async (request, res) => {
  const userId = request.params.user_id;
  const currYear = request.params.year || new Date().getFullYear().toString();
  let nextYear = Number(currYear) + 1;
  nextYear = nextYear.toString();

  const data = {
    "total_walk_distance": 0,
    "total_run_distance": 0,
    "average_run_speed": null,
    "average_walk_speed": null,
    "first_name": "",
    "distance_unit": "Mile",
  };
  let walkTime = 0;
  let runTime = 0;

  // populate user
  const name = await getUserName(userId);
  const isKilometersUser = await getIsKilometersUser(userId);
  data["first_name"] = name;
  data["distance_unit"] = isKilometersUser ? "kilometer" : "mile";

  // retrieve activities
  const snapshot = await admin.firestore().collection("activities")
      .where("user_id", "==", Number(userId))
      .where("is_stroller", "==", true)
      .where("start_date", ">", currYear)
      .where("start_date", "<", nextYear)
      .get();

  if (snapshot.size === 0) {
    res.status(200).send(JSON.stringify(data));
  }

  // populate annual distance data
  snapshot.forEach((doc) => {
    const dbData = doc.data();
    if (dbData.sport_type === "Run") {
      data["total_run_distance"] += getDistance(dbData.distance, isKilometersUser);
      // run_time_seconds = distance (meters) / average_speed (m/s)
      runTime += dbData.distance / dbData.average_speed;
    } else if (dbData.sport_type === "Walk") {
      data["total_walk_distance"] += getDistance(dbData.distance, isKilometersUser);
      walkTime += dbData.distance / dbData.average_speed;
    }
  });

  // populate speeds
  const minsPerUnitRun = Math.floor((runTime / data["total_run_distance"]) / 60);
  const secsPerUnitRun = Math.floor((runTime / data["total_run_distance"]) % 60);
  const minsPerUnitWalk = Math.floor((walkTime / data["total_walk_distance"]) / 60);
  const secsPerUnitWalk = Math.floor((runTime / data["total_walk_distance"]) % 60);

  data["average_run_speed"] = runTime > 0 ? minsPerUnitRun + ":" + secsPerUnitRun.toString().padStart(2, "0") : null;
  data["average_walk_speed"] = walkTime > 0 ? minsPerUnitWalk + ":" + secsPerUnitWalk.toString().padStart(2, "0"): null;

  res.status(200).send(JSON.stringify(data));
});

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

app.post("/auth-user", async (request, response) => {
  const accessToken = request.body.access_token;
  // const userId = request.body.user_id;
  // Check that a user id exists with that access token.
  logger.info("top of /auth-user with: ", request.body, accessToken, typeof accessToken);
  getAuth(firebaseApp)
      .createCustomToken(accessToken)
      .then((customToken) => {
        response.status(200).send({customToken});
      })
      .catch((error) => {
        logger.info("Error creating custom token:", error);
      });
});

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
      .set(userData, {merge: true}).then(() => {
        logger.info("Wrote user to DB", userData);
      });
  response.status(200).send("wrote");
});

const getPrevMonthIdentifier = () => {
  const currDate = new Date().toLocaleDateString("en-US", {timeZone: "America/Los_Angeles"});
  // eslint-disable-next-line no-unused-vars
  const [currentMonth, _, currentYear] = currDate.split("/");
  let previousMonth;
  let previousYear;

  // Handle the case where the current month is January (1)
  if (Number(currentMonth) === 1) {
    previousYear = currentYear - 1; // Subtract 1 from the current year
    previousMonth = 12; // Set the previous month to December (12)
  } else {
    previousYear = currentYear; // Keep the current year
    previousMonth = currentMonth - 1; // Subtract 1 from the current month
  }

  // Return the previous month and year as a string in the format "YYYY-MM"
  return previousYear + "-" + previousMonth;
};


app.get("/leaderboard", async (request, response) => {
  // Verify current opt-ins again to account for opted in then opted out
  const optedInSnap = await db.collection("users").where("opted_in_leaderboard", "==", true).get();
  const optedInUserIds = [];
  optedInSnap.forEach((doc) => {
    const user = doc.data();
    optedInUserIds.push(user.user_id);
  });

  const currDate = new Date().toLocaleDateString("en-US", {timeZone: "America/Los_Angeles"});
  // eslint-disable-next-line no-unused-vars
  const [currMonth, _, year] = currDate.split("/");
  const currMonthIdentifier = `${year}-${currMonth}`;
  logger.info("Found curr month:", currMonthIdentifier);
  const lastMonthIdentifier = getPrevMonthIdentifier();
  logger.info("Found last month:", lastMonthIdentifier);


  const currMonthData = [];
  const lastMonthData = [];
  const currSnapshot = await db.collection("leaderboard")
      .doc(currMonthIdentifier)
      .collection("monthly-data")
      .get();
  currSnapshot.forEach((doc) => {
    const userMonthlyData = doc.data();
    if (optedInUserIds.includes(userMonthlyData.user_id)) {
      logger.info("Found:", userMonthlyData);
      currMonthData.push(userMonthlyData);
    }
  });
  const snapshot = await db.collection("leaderboard")
      .doc(lastMonthIdentifier)
      .collection("monthly-data")
      .get();
  snapshot.forEach((doc) => {
    const userMonthlyData = doc.data();
    if (optedInUserIds.includes(userMonthlyData.user_id)) {
      logger.info(`Found: ${userMonthlyData.first_name}`, userMonthlyData);
      lastMonthData.push(userMonthlyData);
    }
  });
  response.status(200).send(JSON.stringify({currMonthData, lastMonthData}));
});


exports.app = onRequest(app);
exports.writeMonthlyData= onSchedule({
  schedule: "every 60 minutes from 7:00 to 20:00",
  timeZone: "America/Los_Angeles",
}, async () => {
  try {
    await writeMonthlyData(db);
    logger.info("Executed monthly data write");
  } catch (error) {
    logger.error("Error in monthly data write:", error);
  }
});

// Export for testing
exports.isAlreadyProcessed = isAlreadyProcessed;
