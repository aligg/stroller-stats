import { browserLocalPersistence, indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: "stroller-stats.firebaseapp.com",
  projectId: "stroller-stats",
  storageBucket: "stroller-stats.appspot.com",
  messagingSenderId: "958011019232",
  appId: "1:958011019232:web:70b9bc995f933a4c782585",
  measurementId: "G-L9CK7DZZQH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// initializeAuth instead of getAuth leaves out the popup/redirect sign-in code,
// which we don't use (sign-in is a custom token), to keep the main bundle small.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});
