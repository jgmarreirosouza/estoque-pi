import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, Persistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDUtEc22aRdGsvMW812TEV3UojzrpTM1jc',
  authDomain: 'casa-da-crianca-estoque-2.firebaseapp.com',
  projectId: 'casa-da-crianca-estoque-2',
  storageBucket: 'casa-da-crianca-estoque-2.firebasestorage.app',
  messagingSenderId: '678876397395',
  appId: '1:678876397395:web:68ab870548d117254faba6',
};

const app = initializeApp(firebaseConfig);

// Web: browserLocalPersistence (localStorage)
// Native: getReactNativePersistence via AsyncStorage
// eslint-disable-next-line @typescript-eslint/no-require-imports
const persistence: Persistence = Platform.OS === 'web'
  ? browserLocalPersistence
  : (require('@firebase/auth').getReactNativePersistence(AsyncStorage) as Persistence);

export const auth = initializeAuth(app, { persistence });

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

export default app;
