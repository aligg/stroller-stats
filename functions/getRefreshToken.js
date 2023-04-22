const {db} = require("../src/utils/firebase");

exports.getRefreshToken = async (userId) => {
  // TODO: should we encrypt this?
  // return db.collection("users").where("id", "==", userId).limit(1).get()
  //     .then((data) => data.docs[0].get("refresh_token"));
};


