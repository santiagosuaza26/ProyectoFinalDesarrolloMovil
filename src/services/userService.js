import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLocalAuthMode } from '@/services/authService';

const LOCAL_PROFILE_PREFIX = '@didiclone/local-profile/';
const localProfileListeners = new Map();

function profileKey(userId) {
    return `${LOCAL_PROFILE_PREFIX}${userId}`;
}

function emitLocalProfile(userId, profile) {
    const listeners = localProfileListeners.get(userId);
    listeners?.forEach(listener => listener(profile));
}

async function saveLocalProfile(profile) {
    await AsyncStorage.setItem(profileKey(profile.id), JSON.stringify(profile));
    emitLocalProfile(profile.id, profile);
}

async function readLocalProfile(userId) {
    const rawValue = await AsyncStorage.getItem(profileKey(userId));
    return rawValue ? JSON.parse(rawValue) : undefined;
}

function ensureListenerSet(userId) {
    if (!localProfileListeners.has(userId)) {
        localProfileListeners.set(userId, new Set());
    }
    return localProfileListeners.get(userId);
}

const users = () => firestore().collection('users');
export async function saveUserProfile(profile) {
    if (isLocalAuthMode()) {
        const now = new Date().toISOString();
        await saveLocalProfile({
            ...profile,
            updatedAt: now,
            createdAt: profile.createdAt ?? now,
        });
        return;
    }
    const now = firestore.FieldValue.serverTimestamp();
    await users()
        .doc(profile.id)
        .set({
        ...profile,
        updatedAt: now,
        createdAt: profile.createdAt ?? now,
    }, { merge: true });
}
export async function getUserProfile(userId) {
    if (isLocalAuthMode()) {
        return readLocalProfile(userId);
    }
    const snapshot = await users().doc(userId).get();
    if (!snapshot.exists) {
        return undefined;
    }
    return { id: snapshot.id, ...snapshot.data() };
}
export function listenToUserProfile(userId, callback) {
    if (isLocalAuthMode()) {
        const listeners = ensureListenerSet(userId);
        const localListener = profile => callback(profile);
        listeners.add(localListener);
        void readLocalProfile(userId).then(profile => callback(profile));
        return () => {
            const currentListeners = localProfileListeners.get(userId);
            currentListeners?.delete(localListener);
            if (currentListeners && currentListeners.size === 0) {
                localProfileListeners.delete(userId);
            }
        };
    }
    return users()
        .doc(userId)
        .onSnapshot(
          (snapshot) => {
            if (!snapshot) {return;}
            callback(
              snapshot.exists
                ? { id: snapshot.id, ...snapshot.data() }
                : undefined
            );
          },
          (error) => {
            console.error('Error listening to profile:', error);
          }
        );
}
