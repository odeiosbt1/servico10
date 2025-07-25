// src/auth.ts

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User } from "@/types";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// ✅ Hook de login Google
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "1070809826302-8b7842955a27d14fbc36af.apps.googleusercontent.com",
    iosClientId: "1070809826302-ios.apps.googleusercontent.com",
    androidClientId: "1070809826302-android.apps.googleusercontent.com",
    scopes: ["profile", "email"],
  });

  return { request, response, promptAsync };
};

// ✅ Sign in Google com token
export const signInWithGoogle = async (idToken: string, accessToken?: string) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
};

// ✅ Sign in com Email
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Email sign in error:", error);
    throw error;
  }
};

// ✅ Sign up com Email
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Email sign up error:", error);
    throw error;
  }
};

// ✅ Reset de senha
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

// ✅ Logout
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// ✅ Cria perfil no Firestore
export const createUserProfile = async (
  firebaseUser: FirebaseUser,
  userData: Partial<User>
) => {
  try {
    const userRef = doc(db, "users", firebaseUser.uid);

    const cleanUserData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );

    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || cleanUserData.displayName || "",
      photoURL: firebaseUser.photoURL || cleanUserData.photoURL || null,
      userType: cleanUserData.userType!,
      cpf: cleanUserData.cpf || null,
      phone: cleanUserData.phone || null,
      neighborhood: cleanUserData.neighborhood || null,
      serviceType: cleanUserData.serviceType || null,
      isProfileComplete: false,
      status: cleanUserData.userType === "prestador" ? "disponivel" : null,
      rating: cleanUserData.userType === "prestador" ? 0 : null,
      reviewCount: cleanUserData.userType === "prestador" ? 0 : null,
      latitude: cleanUserData.latitude || null,
      longitude: cleanUserData.longitude || null,
      createdAt: new Date(),
    };

    const cleanNewUser = Object.fromEntries(
      Object.entries(newUser).filter(([_, value]) => value !== undefined)
    );

    await setDoc(userRef, cleanNewUser, { merge: true });
    return newUser;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

// ✅ Pega perfil do Firestore
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// ✅ Atualiza perfil
export const updateUserProfile = async (uid: string, userData: Partial<User>) => {
  try {
    const cleanUserData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );

    const userRef = doc(db, "users", uid);
    await setDoc(userRef, cleanUserData, { merge: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};
