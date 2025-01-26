import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCq0CRw-PCU_XrLrxlEjT_dwffGpPByGQg",
  authDomain: "talentouch-539e0.firebaseapp.com",
  projectId: "talentouch-539e0",
  storageBucket: "talentouch-539e0.firebasestorage.app",
  messagingSenderId: "245802166496",
  appId: "1:245802166496:web:1336cb7e78810c83b98885",
  measurementId: "G-8EN5ZNMGCY"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
