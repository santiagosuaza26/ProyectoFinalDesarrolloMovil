import firestore from '@react-native-firebase/firestore';
import type {UserProfile} from '@/types/models';

const users = () => firestore().collection('users');

export async function saveUserProfile(profile: UserProfile) {
  const now = firestore.FieldValue.serverTimestamp();
  await users()
    .doc(profile.id)
    .set(
      {
        ...profile,
        updatedAt: now,
        createdAt: profile.createdAt ?? now,
      },
      {merge: true},
    );
}

export async function getUserProfile(userId: string) {
  const snapshot = await users().doc(userId).get();
  if (!snapshot.exists) {
    return undefined;
  }
  return {id: snapshot.id, ...snapshot.data()} as UserProfile;
}

export function listenToUserProfile(
  userId: string,
  callback: (profile?: UserProfile) => void,
) {
  return users()
    .doc(userId)
    .onSnapshot(snapshot => {
      callback(
        snapshot.exists
          ? ({id: snapshot.id, ...snapshot.data()} as UserProfile)
          : undefined,
      );
    });
}
