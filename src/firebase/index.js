
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBBGzFwfpd5vg50NDqydKmYWj57NNLXDcs",
  authDomain: "gurinvert.firebaseapp.com",
  projectId: "gurinvert",
  storageBucket: "gurinvert.appspot.com",
  messagingSenderId: "839051326604",
  appId: "1:839051326604:web:92ec4fda1fea98a7d937a9",
  measurementId: "G-7KCW3FP7C6"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {
  db,
  storage,
  app 
};