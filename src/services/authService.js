import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_AUTH_USERS_KEY = '@didiclone/local-auth/users';
const LOCAL_AUTH_SESSION_KEY = '@didiclone/local-auth/session';

let localAuthMode = false;
const localAuthListeners = new Set();

function isFirebaseApiKeyError(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    return /API key not valid|Please pass a valid API key|auth\/unknown/i.test(error.message);
}

function emitLocalAuthState(userId) {
    localAuthListeners.forEach(listener => listener(userId));
}

async function readLocalUsers() {
    const rawValue = await AsyncStorage.getItem(LOCAL_AUTH_USERS_KEY);
    return rawValue ? JSON.parse(rawValue) : [];
}

async function saveLocalUsers(users) {
    await AsyncStorage.setItem(LOCAL_AUTH_USERS_KEY, JSON.stringify(users));
}

async function saveLocalSession(session) {
    if (session) {
        await AsyncStorage.setItem(LOCAL_AUTH_SESSION_KEY, JSON.stringify(session));
    }
    else {
        await AsyncStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
    }
}

async function readLocalSession() {
    const rawValue = await AsyncStorage.getItem(LOCAL_AUTH_SESSION_KEY);
    return rawValue ? JSON.parse(rawValue) : undefined;
}

function setLocalAuthMode() {
    localAuthMode = true;
}

function createLocalUserId() {
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function createLocalAccount(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await readLocalUsers();
    if (users.some(user => user.email === normalizedEmail)) {
        throw new Error('This email is already registered.');
    }
    const user = {
        email: normalizedEmail,
        password,
        userId: createLocalUserId(),
    };
    users.push(user);
    await saveLocalUsers(users);
    await saveLocalSession({ userId: user.userId });
    emitLocalAuthState(user.userId);
    return { user: { uid: user.userId } };
}

async function signInLocal(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await readLocalUsers();
    const user = users.find(entry => entry.email === normalizedEmail);
    if (!user || user.password !== password) {
        throw new Error('Invalid email or password.');
    }
    await saveLocalSession({ userId: user.userId });
    emitLocalAuthState(user.userId);
    return { user: { uid: user.userId } };
}

async function performFallbackAuth(email, password, mode) {
    setLocalAuthMode();
    if (mode === 'sign-in') {
        return signInLocal(email, password);
    }
    return createLocalAccount(email, password);
}

export async function signIn(email, password) {
    if (localAuthMode) {
        const credential = await signInLocal(email, password);
        return credential.user;
    }
    try {
        const credential = await auth().signInWithEmailAndPassword(email.trim(), password);
        return credential.user;
    }
    catch (error) {
        if (isFirebaseApiKeyError(error)) {
            const credential = await performFallbackAuth(email, password, 'sign-in');
            return credential.user;
        }
        throw error;
    }
}
export async function signUp(email, password) {
    if (localAuthMode) {
        const credential = await createLocalAccount(email, password);
        return credential.user;
    }
    try {
        const credential = await auth().createUserWithEmailAndPassword(email.trim(), password);
        return credential.user;
    }
    catch (error) {
        if (isFirebaseApiKeyError(error)) {
            const credential = await performFallbackAuth(email, password, 'sign-up');
            return credential.user;
        }
        throw error;
    }
}
export function signOut() {
    if (localAuthMode) {
        return saveLocalSession(undefined).then(() => {
            emitLocalAuthState(undefined);
        });
    }
    return auth().signOut();
}
export function onAuthChanged(callback) {
    const localListener = userId => {
        if (localAuthMode) {
            callback(userId);
        }
    };
    localAuthListeners.add(localListener);
    let unsubscribe = () => {};
    void readLocalSession().then(session => {
        if (session?.userId) {
            setLocalAuthMode();
            callback(session.userId);
            return;
        }
        unsubscribe = auth().onAuthStateChanged(user => {
            if (!localAuthMode) {
                callback(user?.uid);
            }
        });
    });
    return () => {
        localAuthListeners.delete(localListener);
        unsubscribe();
    };
}
export function isLocalAuthMode() {
    return localAuthMode;
}
