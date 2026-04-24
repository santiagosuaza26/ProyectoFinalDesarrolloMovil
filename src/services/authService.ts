import auth from '@react-native-firebase/auth';

export async function signIn(email: string, password: string) {
  const credential = await auth().signInWithEmailAndPassword(
    email.trim(),
    password,
  );
  return credential.user;
}

export async function signUp(email: string, password: string) {
  const credential = await auth().createUserWithEmailAndPassword(
    email.trim(),
    password,
  );
  return credential.user;
}

export function signOut() {
  return auth().signOut();
}

export function onAuthChanged(callback: (userId?: string) => void) {
  return auth().onAuthStateChanged(user => callback(user?.uid));
}
