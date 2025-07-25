import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCG4pAOvQMi48UWG7-E3oD6tCrJsF9m7X0",
  authDomain: "servicofacil-726b9.firebaseapp.com",
  projectId: "servicofacil-726b9",
  storageBucket: "servicofacil-726b9.appspot.com",
  messagingSenderId: "1070809826302",
  appId: "1:1070809826302:web:8b7842955a27d14fbc36af",
  measurementId: "G-18HTJCRDS7"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };
export default app;