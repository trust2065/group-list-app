import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD57qXaTMWfwqPPsT3iOEvsg1sfvj7wZVA",
  authDomain: "ultimo-admin.firebaseapp.com",
  projectId: "ultimo-admin",
  storageBucket: "ultimo-admin.firebasestorage.app",
  messagingSenderId: "619355767575",
  appId: "1:619355767575:web:3a1135a30d72351ee4ad52",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
