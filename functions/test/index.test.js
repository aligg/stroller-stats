const {describe, it, afterEach, beforeEach} = require("node:test");
const assert = require("node:assert");
const firebaseTest = require("firebase-functions-test")();

// We need to import the function after initializing firebase-functions-test
const {isAlreadyProcessed, retrieveMonthlyStrollerDistance, db} = require("../index");

describe("isAlreadyProcessed", () => {
  afterEach(() => {
    firebaseTest.cleanup();
  });

  it("should return false for null or undefined description", () => {
    assert.strictEqual(isAlreadyProcessed(null), false);
    assert.strictEqual(isAlreadyProcessed(undefined), false);
    assert.strictEqual(isAlreadyProcessed(""), false);
  });

  it("should return false for description without any processed markers", () => {
    const description = "Just a regular activity description";
    assert.strictEqual(isAlreadyProcessed(description), false);
  });

  it("should return true for description with 'StrollerStats.com -' marker", () => {
    const description = `Easy morning run with the kids

#strollerstats
StrollerStats.com - Monthly stats updated`;
    assert.strictEqual(isAlreadyProcessed(description), true);
  });

  it("should return true for description with '| StrollerStats' marker", () => {
    const description = `Traded off stroller with partner, so probably 2.75 miles with the stroller

#strollerstats(2.75)
15.2 January stroller run miles | StrollerStats`;
    assert.strictEqual(isAlreadyProcessed(description), true);
  });

  it("should return true for description with '| strollerstats' marker", () => {
    const description = `Hill repeats at the park
#strollerstats
8.5 February stroller walk miles | strollerstats`;
    assert.strictEqual(isAlreadyProcessed(description), true);
  });

  it("should return true for description with '| https://www.strollerstats.com' marker", () => {
    const description = `4x20s hills
#StrollerStats
12.3 March stroller run miles | https://www.strollerstats.com`;
    assert.strictEqual(isAlreadyProcessed(description), true);
  });

  it("should return true when marker appears in middle of description", () => {
    const description = `6am run before work
#strollerstats(1.5)
10.5 April stroller run miles | StrollerStats
Great way to start the day!`;
    assert.strictEqual(isAlreadyProcessed(description), true);
  });

  it("should handle case sensitivity correctly", () => {
    // These SHOULD match (exact case)
    assert.strictEqual(isAlreadyProcessed("contains | strollerstats marker"), true);
  });
});


describe("retrieveMonthlyStrollerDistance", () => {
  beforeEach(async () => {
    // Clear activities collection
    const snapshot = await db.collection("activities").get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  });

  afterEach(() => {
    firebaseTest.cleanup();
  });

  it("includes historical stroller activities where is_pack is missing", async () => {
    const userId = "user_123";
    const sportType = "Run";

    const startDate = new Date("2025-01-15T08:00:00Z").toISOString();

    // Historical stroller activity (NO is_pack field)
    await db.collection("activities").add({
      user_id: userId,
      sport_type: sportType,
      start_date: startDate,
      distance: 5000, // meters
      is_stroller: true,
      // is_pack intentionally missing
    });

    // Pack activity that should NOT be included
    await db.collection("activities").add({
      user_id: userId,
      sport_type: sportType,
      start_date: startDate,
      distance: 3000,
      is_stroller: false,
      is_pack: true,
    });

    const recentActivity = {
      user_id: userId,
      sport_type: sportType,
      start_date: startDate,
    };

    const total = await retrieveMonthlyStrollerDistance(
        recentActivity,
        false, // miles
    );

    // 5000 meters ≈ 3.11 miles
    assert.strictEqual(Number(total), 3.11);
  });
});

