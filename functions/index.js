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

const firebaseApp = admin.initializeApp(firebaseConfig);
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
  if (data["name"]) {
    isStroller = data["name"].toLowerCase().includes("strollerstats") || data["name"].toLowerCase().includes("strollermiles");
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
  const totalMiles = totalMeters * 0.000621371192; // Convert to miles
  const roundedTotalMiles = totalMiles.toFixed(2);
  functions.logger.info(`Got total miles ${roundedTotalMiles}`);

  return roundedTotalMiles;
};

const updateDescription = async (recentActivity, accessToken) => {
  const description = recentActivity.description;
  // if already wrote, exit
  if (description.includes("StrollerStats.com -") || description.includes("| strollerstats.com")) {
    return;
  }
  const activityId = recentActivity.activity_id;
  const totalMiles = await retrieveMonthlyStrollerMiles(recentActivity);
  const currMonth = new Date(recentActivity.start_date).toLocaleString("default", {month: "long"});
  // eslint-disable-next-line max-len
  const updatedDescription = description.concat("\n", `${totalMiles} ${currMonth} stroller ${recentActivity.sport_type.toLowerCase()} miles | strollerstats.com`);
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

const getMiles = (meters) =>{
  return meters * 0.000621371192;
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

app.get("/user/:user_id", async (request, res) => {
  const userId = request.params.user_id;
  functions.logger.info(userId);
  const doc = await getUser(userId);
  functions.logger.info("doc", doc);
  const data = await doc.data();
  functions.logger.info("Data", data);
  res.status(200).send(JSON.stringify(data));
});

app.post("/update-user/", async (request, res) => {
  const userId = request.body.user_id;

  const userData = request.body;

  await db.collection("users").doc(userId.toString())
      .update(userData).then(() => {
        functions.logger.info("Wrote user update to DB", userData);
      });
  res.status(200).send({"updated_user": userId});
});

app.get("/user-activity-data/:user_id", async (request, res) => {
  const userId = request.params.user_id;
  const data = {
    "total_walk_miles": 0,
    "total_run_miles": 0,
    "average_run_speed": null,
    "average_walk_speed": null,
    "first_name": "",
  };
  const currYear = new Date().getFullYear().toString();
  let walkTime = 0;
  let runTime = 0;

  // populate user
  const name = await getUserName(userId);
  data["first_name"] = name;

  // retrieve activities
  const snapshot = await admin.firestore().collection("activities")
      .where("user_id", "==", Number(userId))
      .where("is_stroller", "==", true)
      .where("start_date", ">", currYear)
      .get();

  if (snapshot.size === 0) {
    res.status(200).send(JSON.stringify(data));
  }

  // populate annual mileage data
  snapshot.forEach((doc) => {
    const dbData = doc.data();
    if (dbData.sport_type === "Run") {
      data["total_run_miles"] += getMiles(dbData.distance);
      // run_time_seconds = distance (meters) / average_speed (m/s)
      runTime += dbData.distance / dbData.average_speed;
    } else if (dbData.sport_type === "Walk") {
      data["total_walk_miles"] += getMiles(dbData.distance);
      walkTime += dbData.distance / dbData.average_speed;
    }
  });

  // populate speeds
  const minsPerMileRun = Math.floor((runTime / data["total_run_miles"]) / 60);
  const secsPerMileRun = Math.floor((runTime / data["total_run_miles"]) % 60);
  const minsPerMileWalk = Math.floor((walkTime / data["total_walk_miles"]) / 60);
  const secsPerMileWalk = Math.floor((runTime / data["total_walk_miles"]) % 60);

  data["average_run_speed"] = runTime > 0 ? minsPerMileRun + ":" + secsPerMileRun.toString().padStart(2, "0") : null;
  data["average_walk_speed"] = walkTime > 0 ? minsPerMileWalk + ":" + secsPerMileWalk.toString().padStart(2, "0"): null;

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

const getBeginningOfYearTimestamp = () => {
  const now = new Date(); // Get the current date
  const year = now.getFullYear(); // Get the current year
  const beginningOfYear = new Date(year, 0, 1); // Create a new Date object for January 1st of the current year
  const timestamp = Math.floor(beginningOfYear.getTime() / 1000); // Get the epoch timestamp by dividing the milliseconds by 1000

  return timestamp;
};

app.post("/auth-user", async (request, response) => {
  const accessToken = request.body.access_token;
  // const userId = request.body.user_id;
  // Check that a user id exists with that access token.
  functions.logger.info("top of /auth-user with: ", request.body, accessToken, typeof accessToken);
  getAuth(firebaseApp)
      .createCustomToken(accessToken)
      .then((customToken) => {
        response.status(200).send({customToken});
      })
      .catch((error) => {
        functions.logger.info("Error creating custom token:", error);
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
        functions.logger.info("Wrote user to DB", userData);
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
  if (currentMonth === 1) {
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
  functions.logger.info("Found curr month:", currMonthIdentifier);
  const lastMonthIdentifier = getPrevMonthIdentifier();
  functions.logger.info("Found last month:", lastMonthIdentifier);


  const currMonthData = [];
  const lastMonthData = [];
  const currSnapshot = await db.collection("leaderboard")
      .doc(currMonthIdentifier)
      .collection("monthly-data")
      .get();
  currSnapshot.forEach((doc) => {
    const userMonthlyData = doc.data();
    if (optedInUserIds.includes(userMonthlyData.user_id)) {
      functions.logger.info("Found:", userMonthlyData);
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
      functions.logger.info("Found:", userMonthlyData);
      lastMonthData.push(userMonthlyData);
    }
  });
  response.status(200).send(JSON.stringify({currMonthData, lastMonthData}));
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
  });
  res.status(200).send(JSON.stringify({writes: writes, activities_length: data.length, start_date: firstActivity, end_date: lastActivity}));
});


exports.app = functions.https.onRequest(app);
exports.monthlyData = functions.pubsub.schedule("every 60 minutes from 7:00 to 20:00").onRun((context) => {
  writeMonthlyData(db).then(() => {
    functions.logger.info("Executed monthly data write");
  });
  return null;
});
