
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./firebase";

export const getMessagingToken = async () => {
    if (typeof window === 'undefined' || !(await isSupported())) {
        console.log("Firebase Messaging is not supported in this browser.");
        return null;
    }
    
    const messaging = getMessaging(app);
    
    // You need a service worker to handle background notifications.
    // Create a file named `public/firebase-messaging-sw.js` with the following content:
    // importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
    // importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");
    // firebase.initializeApp({ ...your firebase config... });
    // const messaging = firebase.messaging();

    try {
        const currentToken = await getToken(messaging, { 
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
        });
        if (currentToken) {
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
        return null;
    }
};

export { isSupported };
