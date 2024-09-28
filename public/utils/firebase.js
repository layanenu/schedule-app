import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
let analytics;

export const AnalyticsInit = async () => {
  if (await isSupported()){
      analytics =  getAnalytics(app);
      console.log("Firebase Analytics foi inicializado com sucesso!");
  } else {
      console.warn("Firebase Analytics não é suportado nesse ambiente!");
  }
}

export const addTaskToFirestore = async (task) => {
  try {
    if (typeof task === "object" && !Array.isArray(task) && task !== null) {
      if (Object.keys(task).length === 0) {
        throw new Error("O objeto de tarefa está vazio.");
      }

      const docRef = await addDoc(collection(db, "tasks"), task);


      if(analytics){
        logEvent(analytics, 'add_task', {
            task_id: docRef.id,
            task_title: task.title,
            createdAt: new Date().toISOString()
        })

        console.log('Evento de adição de tarefa registado com sucesso', {
            task_id: docRef.id,
            task_title: task.title,
            createdAt: new Date().toISOString()
        })
    }

      console.log("Documento escrito com sucesso: ", docRef.id);
    } else {
      throw new Error(
        "Dados inválidos para adicionar ao Firestore. Esperado um objeto."
      );
    }
  } catch (error) {
    console.error("Erro ao adicionar o documento:", error);
  }
};

export const getTasksFromFirestore = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "tasks"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao obter tarefas do Firestore:", error);
    return [];
  }
};

export const signUp = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    await addDoc(collection(db, "users"), {
      uid: user.uid,
      email: user.email,
      displayName,
      createdAt: new Date(),
    });

    if(analytics){
      logEvent(analytics, 'sign_up', {
          uid: user.uid,
          email: user.email,
          displayName,
          createdAt: new Date().toISOString()
      })

      console.log('Evento de criação de usuário registrado com sucesso!', {
          uid: user.uid,
          email: user.email,
          displayName,
          createdAt: new Date().toISOString()
      })
  }


    return user;
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    throw error;
  }
};


export const signIn = async (email, password) => {
  try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if(analytics){
          logEvent(analytics, 'login', {
              uid: user.uid,
              email: user.email,
              loggedAt: new Date().toISOString()
          })

          console.log('Evento de login registrado com sucesso: ', {
              uid: user.uid,
              email: user.email,
              loggedAt: new Date().toISOString()
          })
      }

      return user;
  } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);

    if(analytics){
      logEvent(analytics, 'logout', {
          loggedOutAt: new Date().toISOString()
      })
      console.log('Evento de logout resitrado com sucesso: ', {
          loggedOutAt: new Date().toISOString()
      })
  }
  } catch (error) {
    console.error("Erro ao sair:", error);
    throw error;
  }
};
