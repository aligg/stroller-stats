/* eslint-disable max-len */
const functions = require("firebase-functions");

const getActivityDataForCurrMonth = async (userId, firstName, db) => {
  const currDate = new Date();
  const startOfMonth = new Date(currDate.getFullYear(),
      currDate.getMonth(), 1).toISOString();
  const startOfNextMonth = new Date(currDate.getFullYear(),
      currDate.getMonth() + 1, 1).toISOString();
  const activities = await db.collection("activities")
      .where("user_id", "==", Number(userId))
      .where("start_date", ">=", startOfMonth)
      .where("start_date", "<", startOfNextMonth)
      .where("is_stroller", "==", true)
      .get();
  const monthlyData = {run_distance: 0, walk_distance: 0, first_name: firstName, user_id: userId};
  activities.forEach((doc) => {
    const data = doc.data();
    const key = `${data.sport_type.toLowerCase()}_distance`;
    monthlyData[key] += data.distance;
  });
  return monthlyData;
};

const getOptedInUsers = async (db) => {
  const snapshot = await db.collection("users").where("opted_in_leaderboard", "==", true).get();
  functions.logger.info("Opted in users size", snapshot.size);
  const optedInUsers = [];
  snapshot.forEach((doc) => {
    const user = doc.data();
    optedInUsers.push([user.user_id, user.first_name]);
  });
  return optedInUsers;
};

const updateLeaderboardData = async (userId, data, db) => {
  const currDate = new Date();
  const currMonth = currDate.getMonth() + 1;
  const year = currDate.getFullYear();
  const monthIdentifier = `${year}-${currMonth}`;
  const docRef = await db.collection("leaderboard").doc(monthIdentifier);
  docRef.collection("monthly-data").doc(userId.toString()).set(data, {merge: true});
};

const writeMonthlyData = async (db) => {
  const users = await getOptedInUsers(db);

  users.forEach((user) => {
    const [userId, firstName] = user;
    getActivityDataForCurrMonth(userId, firstName, db).then((data) => {
      updateLeaderboardData(userId, data, db).then(() => {
        functions.logger.info("Updated leaderboard for:", userId);
      });
    });
  });
};

exports.writeMonthlyData = writeMonthlyData;
