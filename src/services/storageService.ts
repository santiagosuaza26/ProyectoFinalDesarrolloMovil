import storage from '@react-native-firebase/storage';

export async function uploadProfilePhoto(userId: string, imageUri: string) {
  const extension = imageUri.split('.').pop() || 'jpg';
  const reference = storage().ref(`users/${userId}/profile.${extension}`);
  await reference.putFile(imageUri);
  return reference.getDownloadURL();
}
