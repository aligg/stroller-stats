const {describe, it} = require("node:test");
const assert = require("node:assert");
const {computeWrapped} = require("../wrapped");

const ME = 1;

const activity = (overrides) => ({
  user_id: ME,
  distance: 5000,
  sport_type: "Run",
  start_date: "2026-03-10T14:00:00Z",
  title: "Morning Run #strollerstats",
  is_stroller: true,
  is_pack: false,
  ...overrides,
});

describe("computeWrapped", () => {
  it("returns empty stats for a user with no activities", () => {
    const result = computeWrapped({activities: [], leaderboardUserIds: null, userId: ME});
    assert.strictEqual(result.stroller.total_distance, 0);
    assert.strictEqual(result.stroller.activity_count, 0);
    assert.strictEqual(result.stroller.longest, null);
    assert.strictEqual(result.stroller.busiest_month, null);
    assert.strictEqual(result.pack, null);
    assert.deepStrictEqual(result.leaderboard, {opted_in: false, rank: null, participants: null});
  });

  it("totals runs (including trail runs) and walks separately", () => {
    const result = computeWrapped({
      activities: [
        activity({distance: 5000, sport_type: "Run"}),
        activity({distance: 8000, sport_type: "TrailRun"}),
        activity({distance: 3000, sport_type: "Walk"}),
      ],
      leaderboardUserIds: null,
      userId: ME,
    });
    assert.strictEqual(result.stroller.run_distance, 13000);
    assert.strictEqual(result.stroller.run_count, 2);
    assert.strictEqual(result.stroller.walk_distance, 3000);
    assert.strictEqual(result.stroller.walk_count, 1);
    assert.strictEqual(result.stroller.total_distance, 16000);
    assert.strictEqual(result.stroller.activity_count, 3);
  });

  it("averages run speed across runs, weighted by distance", () => {
    const result = computeWrapped({
      activities: [
        activity({distance: 5000, average_speed: 2.5}), // 2000 s
        activity({distance: 10000, average_speed: 2}), // 5000 s
        activity({distance: 3000, sport_type: "Walk", average_speed: 1.5}),
        activity({distance: 4000, average_speed: 0}), // no speed recorded, skipped
      ],
      leaderboardUserIds: null,
      userId: ME,
    });
    assert.strictEqual(result.stroller.average_run_speed, 15000 / 7000);
  });

  it("has no run speed without runs", () => {
    const result = computeWrapped({
      activities: [activity({sport_type: "Walk", average_speed: 1.5})],
      leaderboardUserIds: null,
      userId: ME,
    });
    assert.strictEqual(result.stroller.average_run_speed, null);
  });

  it("finds the longest stroller activity", () => {
    const result = computeWrapped({
      activities: [
        activity({distance: 5000}),
        activity({distance: 21097, start_date: "2026-04-06T15:00:00Z", title: "Half!"}),
      ],
      leaderboardUserIds: null,
      userId: ME,
    });
    assert.deepStrictEqual(result.stroller.longest, {
      distance: 21097,
      sport_type: "Run",
      start_date: "2026-04-06T15:00:00Z",
      title: "Half!",
    });
  });

  it("picks the busiest month by total distance, not activity count", () => {
    const result = computeWrapped({
      activities: [
        activity({distance: 1000, start_date: "2026-01-02T10:00:00Z"}),
        activity({distance: 1000, start_date: "2026-01-03T10:00:00Z"}),
        activity({distance: 5000, start_date: "2026-05-20T10:00:00Z"}),
      ],
      leaderboardUserIds: null,
      userId: ME,
    });
    assert.deepStrictEqual(result.stroller.busiest_month, {month: 5, distance: 5000});
  });

  it("reports pack stats only when the user has pack activities", () => {
    const result = computeWrapped({
      activities: [
        activity({distance: 5000}),
        activity({distance: 2000, sport_type: "Hike", is_stroller: false, is_pack: true}),
        activity({distance: 1000, sport_type: "Walk", is_stroller: false, is_pack: true}),
      ],
      leaderboardUserIds: null,
      userId: ME,
    });
    assert.deepStrictEqual(result.pack, {total_distance: 3000, activity_count: 2});
    assert.strictEqual(result.stroller.total_distance, 5000);
  });

  it("handles a pack-only year", () => {
    const result = computeWrapped({
      activities: [activity({sport_type: "Hike", is_stroller: false, is_pack: true})],
      leaderboardUserIds: null,
      userId: ME,
    });
    assert.strictEqual(result.stroller.total_distance, 0);
    assert.strictEqual(result.stroller.busiest_month, null);
    assert.deepStrictEqual(result.pack, {total_distance: 5000, activity_count: 1});
  });

  it("ranks opted-in users by total stroller distance, ignoring others and pack", () => {
    const yearActivities = [
      {user_id: ME, distance: 10000, is_stroller: true},
      {user_id: 2, distance: 30000, is_stroller: true},
      {user_id: 3, distance: 5000, is_stroller: true},
      {user_id: 3, distance: 50000, is_stroller: false},
      {user_id: 4, distance: 99000, is_stroller: true},
    ];
    const result = computeWrapped({
      activities: [],
      yearActivities,
      leaderboardUserIds: new Set([ME, 2, 3]),
      userId: ME,
    });
    assert.deepStrictEqual(result.leaderboard, {opted_in: true, rank: 2, participants: 3});
  });

  it("gives tied users the same rank", () => {
    const result = computeWrapped({
      activities: [],
      yearActivities: [
        {user_id: ME, distance: 10000, is_stroller: true},
        {user_id: 2, distance: 10000, is_stroller: true},
      ],
      leaderboardUserIds: new Set([ME, 2]),
      userId: ME,
    });
    assert.deepStrictEqual(result.leaderboard, {opted_in: true, rank: 1, participants: 2});
  });

  it("has no rank for an opted-in user with no stroller distance", () => {
    const result = computeWrapped({
      activities: [],
      yearActivities: [{user_id: 2, distance: 10000, is_stroller: true}],
      leaderboardUserIds: new Set([ME, 2]),
      userId: ME,
    });
    assert.deepStrictEqual(result.leaderboard, {opted_in: true, rank: null, participants: 1});
  });
});
