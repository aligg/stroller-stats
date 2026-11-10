// Keep in sync with RUN_TYPES in index.js.
const RUN_TYPES = ["Run", "TrailRun"];

/**
 * Ranks the user among opted-in leaderboard users by total stroller distance
 * for the year.
 * @param {Array<object>} yearActivities activities from all users for the year
 * @param {Set<number>} leaderboardUserIds opted-in user ids
 * @param {number} userId
 * @return {{rank: (number|null), participants: number}}
 */
const computeRank = (yearActivities, leaderboardUserIds, userId) => {
  const totals = new Map();
  for (const activity of yearActivities) {
    if (!activity.is_stroller || !leaderboardUserIds.has(activity.user_id)) continue;
    totals.set(activity.user_id, (totals.get(activity.user_id) || 0) + activity.distance);
  }
  const myTotal = totals.get(userId) || 0;
  const participants = [...totals.values()].filter((total) => total > 0).length;
  if (myTotal === 0) {
    return {rank: null, participants};
  }
  const ahead = [...totals.values()].filter((total) => total > myTotal).length;
  return {rank: ahead + 1, participants};
};

/**
 * Builds a user's Stroller Wrapped stats for one year. All distances are in
 * meters; the client converts to the user's units.
 * @param {object} params
 * @param {Array<object>} params.activities the user's stroller and pack activities for the year
 * @param {Array<object>} [params.yearActivities] all users' activities for the year, used for rank
 * @param {Set<number>|null} params.leaderboardUserIds opted-in user ids, or null when
 *   the user isn't opted in
 * @param {number} params.userId
 * @return {object}
 */
const computeWrapped = ({activities, yearActivities = [], leaderboardUserIds, userId}) => {
  const monthTotals = new Array(12).fill(0);
  const stroller = {
    total_distance: 0,
    run_distance: 0,
    walk_distance: 0,
    activity_count: 0,
    run_count: 0,
    walk_count: 0,
    longest: null,
    busiest_month: null,
    average_run_speed: null,
  };
  // Pace only counts runs that have a recorded speed.
  let timedRunDistance = 0;
  let runSeconds = 0;
  const pack = {total_distance: 0, activity_count: 0};

  for (const activity of activities) {
    if (activity.is_stroller) {
      if (RUN_TYPES.includes(activity.sport_type)) {
        stroller.run_distance += activity.distance;
        stroller.run_count += 1;
        if (activity.average_speed > 0) {
          timedRunDistance += activity.distance;
          runSeconds += activity.distance / activity.average_speed;
        }
      } else if (activity.sport_type === "Walk") {
        stroller.walk_distance += activity.distance;
        stroller.walk_count += 1;
      } else {
        continue;
      }
      stroller.total_distance += activity.distance;
      stroller.activity_count += 1;
      // Bucket by UTC month to match /me/monthly-activities.
      monthTotals[new Date(activity.start_date).getUTCMonth()] += activity.distance;
      if (!stroller.longest || activity.distance > stroller.longest.distance) {
        stroller.longest = {
          distance: activity.distance,
          sport_type: activity.sport_type,
          start_date: activity.start_date,
          title: activity.title || null,
        };
      }
    } else if (activity.is_pack) {
      pack.total_distance += activity.distance;
      pack.activity_count += 1;
    }
  }

  if (runSeconds > 0) {
    // meters per second; the client turns it into min/mile or min/km.
    stroller.average_run_speed = timedRunDistance / runSeconds;
  }

  if (stroller.total_distance > 0) {
    const busiest = monthTotals.indexOf(Math.max(...monthTotals));
    stroller.busiest_month = {month: busiest + 1, distance: monthTotals[busiest]};
  }

  const leaderboard = leaderboardUserIds ?
    {opted_in: true, ...computeRank(yearActivities, leaderboardUserIds, userId)} :
    {opted_in: false, rank: null, participants: null};

  return {
    stroller,
    pack: pack.activity_count > 0 ? pack : null,
    leaderboard,
  };
};

module.exports = {computeWrapped};
