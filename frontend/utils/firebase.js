// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "hivemind-ba486.firebaseapp.com",
  projectId: "hivemind-ba486",
  storageBucket: "hivemind-ba486.firebasestorage.app",
  messagingSenderId: "530693481937",
  appId: "1:530693481937:web:9a9ae1014f13e7d8abecf0"
  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth=getAuth(app)
export const googleProvider=new GoogleAuthProvider()