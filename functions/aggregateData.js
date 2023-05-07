import {
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
const functions = require("firebase-functions");


// eslint-disable-next-line max-len
exports.aggregateData = onDocumentCreated("activities/{activityId}", (event) => {
  // Get an object representing the document
  // e.g. {'name': 'Marie', 'age': 66}
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }
  const data = snapshot.data();

  // access a particular field as you would any JS property
  const activityId = data.activity_id;
  const sportType = data.sport_type;
  const userId = data.user_id;
  const distance = data.distance;

  // eslint-disable-next-line max-len
  functions.logger.info("IN ON DOC CREATE", activityId, sportType, userId, distance);
});
