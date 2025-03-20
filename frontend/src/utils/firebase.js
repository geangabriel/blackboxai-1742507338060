import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Suas configurações do Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Funções de autenticação
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    return { ...userCredential.user, ...userDoc.data() };
  } catch (error) {
    throw new Error('Erro ao fazer login: ' + error.message);
  }
};

export const registerUser = async (userData) => {
  try {
    const { email, password, name, phone, city, userType, photo } = userData;
    
    // Criar usuário no Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Upload da foto se existir
    let photoURL = null;
    if (photo) {
      const photoRef = ref(storage, `users/${userCredential.user.uid}/profile.jpg`);
      const response = await fetch(photo);
      const blob = await response.blob();
      await uploadBytes(photoRef, blob);
      photoURL = await getDownloadURL(photoRef);
    }

    // Atualizar perfil do usuário no Authentication
    await updateProfile(userCredential.user, {
      displayName: name,
      photoURL: photoURL
    });

    // Criar documento do usuário no Firestore
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDocRef, {
      name,
      email,
      phone,
      city,
      type: userType,
      photoURL,
      createdAt: new Date().toISOString()
    });

    return { ...userCredential.user, type: userType };
  } catch (error) {
    throw new Error('Erro ao criar conta: ' + error.message);
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    const { name, phone, city, photo } = userData;
    const userDocRef = doc(db, 'users', userId);

    let photoURL = userData.photoURL;
    if (photo && photo !== photoURL) {
      const photoRef = ref(storage, `users/${userId}/profile.jpg`);
      const response = await fetch(photo);
      const blob = await response.blob();
      await uploadBytes(photoRef, blob);
      photoURL = await getDownloadURL(photoRef);
    }

    const updateData = {
      name,
      phone,
      city,
      photoURL,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(userDocRef, updateData);
    
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL
      });
    }

    return { ...userData, photoURL };
  } catch (error) {
    throw new Error('Erro ao atualizar perfil: ' + error.message);
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error('Erro ao fazer logout: ' + error.message);
  }
};

// Funções do Firestore para rides (transportes)
export const createRideRequest = async (rideData) => {
  try {
    const ridesCollection = collection(db, 'rides');
    const newRideRef = doc(ridesCollection);
    
    await setDoc(newRideRef, {
      ...rideData,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    return newRideRef.id;
  } catch (error) {
    throw new Error('Erro ao criar solicitação: ' + error.message);
  }
};

export const getRidesByCity = async (city) => {
  try {
    const ridesCollection = collection(db, 'rides');
    const q = query(
      ridesCollection,
      where('city', '==', city),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Erro ao buscar solicitações: ' + error.message);
  }
};

export const updateRideStatus = async (rideId, status, driverId = null) => {
  try {
    const rideRef = doc(db, 'rides', rideId);
    await updateDoc(rideRef, {
      status,
      driverId,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    throw new Error('Erro ao atualizar status: ' + error.message);
  }
};

// Funções do Firestore para wallet (carteira)
export const getWalletBalance = async (userId) => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);
    
    if (!walletDoc.exists()) {
      await setDoc(walletRef, { balance: 0 });
      return 0;
    }

    return walletDoc.data().balance;
  } catch (error) {
    throw new Error('Erro ao buscar saldo: ' + error.message);
  }
};

export const updateWalletBalance = async (userId, amount, type) => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);
    
    let currentBalance = 0;
    if (walletDoc.exists()) {
      currentBalance = walletDoc.data().balance;
    }

    const newBalance = type === 'credit' 
      ? currentBalance + amount 
      : currentBalance - amount;

    await updateDoc(walletRef, { 
      balance: newBalance,
      updatedAt: new Date().toISOString()
    });

    // Registrar transação
    const transactionsCollection = collection(db, 'transactions');
    await setDoc(doc(transactionsCollection), {
      userId,
      amount,
      type,
      balance: newBalance,
      createdAt: new Date().toISOString()
    });

    return newBalance;
  } catch (error) {
    throw new Error('Erro ao atualizar saldo: ' + error.message);
  }
};

export const getTransactionHistory = async (userId) => {
  try {
    const transactionsCollection = collection(db, 'transactions');
    const q = query(
      transactionsCollection,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Erro ao buscar histórico: ' + error.message);
  }
};

export default {
  auth,
  db,
  storage,
  loginUser,
  registerUser,
  updateUserProfile,
  signOut,
  createRideRequest,
  getRidesByCity,
  updateRideStatus,
  getWalletBalance,
  updateWalletBalance,
  getTransactionHistory
};