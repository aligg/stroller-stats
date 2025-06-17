const {describe, it, afterEach} = require("node:test");
const assert = require("node:assert");
const firebaseTest = require("firebase-functions-test")();

// We need to import the function after initializing firebase-functions-test
const {isAlreadyProcessed} = require("../index");

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
