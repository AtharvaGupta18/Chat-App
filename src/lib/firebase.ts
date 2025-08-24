
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCBMs3TSLkc6x-i1rvGOlUoDDrkgrTZ8L4",
  authDomain: "whisperlink-ys32m.firebaseapp.com",
  projectId: "whisperlink-ys32m",
  storageBucket: "whisperlink-ys32m.firebasestorage.app",
  messagingSenderId: "194543347950",
  appId: "1:194543347950:web:386b34219b93209a2c2bff"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
