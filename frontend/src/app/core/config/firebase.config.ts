import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB7BBvEiWasbV1vDrQoF7sJSMlwBu_sdU8',
  authDomain: 'ophthalmology-abd50.firebaseapp.com',
  projectId: 'ophthalmology-abd50',
  storageBucket: 'ophthalmology-abd50.firebasestorage.app',
  messagingSenderId: '347048202978',
  appId: '1:347048202978:web:9c8e1a90c23dc0a5ea84bb',
  measurementId: 'G-RWRQYX6HQ9'
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb   = getFirestore(firebaseApp);
