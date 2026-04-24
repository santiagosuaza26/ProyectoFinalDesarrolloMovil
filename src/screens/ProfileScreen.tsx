import React, {useEffect, useState} from 'react';
import {Alert, Image, StyleSheet, Text, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useTranslation} from 'react-i18next';
import {AppButton} from '@/components/AppButton';
import {AppTextInput} from '@/components/AppTextInput';
import {GenderPicker} from '@/components/GenderPicker';
import {LanguagePicker} from '@/components/LanguagePicker';
import {Screen} from '@/components/Screen';
import {useAppSelector} from '@/store/hooks';
import {signOut} from '@/services/authService';
import {saveUserProfile} from '@/services/userService';
import {uploadProfilePhoto} from '@/services/storageService';
import {validateProfileForm} from '@/utils/validation';
import type {Gender, LanguageCode} from '@/types/models';

export function ProfileScreen() {
  const {t} = useTranslation();
  const {userId, profile} = useAppSelector(state => state.auth);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [email, setEmail] = useState('');
  const [preferredLanguage, setPreferredLanguage] =
    useState<LanguageCode>('es');
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setFullName(profile.fullName);
    setPhoneNumber(profile.phoneNumber);
    setGender(profile.gender);
    setEmail(profile.email);
    setPreferredLanguage(profile.preferredLanguage);
    setPhotoUrl(profile.photoUrl);
  }, [profile]);

  async function handlePickPhoto() {
    if (!userId) {
      return;
    }
    setUploadingPhoto(true);
    try {
      const result = await launchImageLibrary({mediaType: 'photo'});
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        const nextPhotoUrl = await uploadProfilePhoto(userId, uri);
        setPhotoUrl(nextPhotoUrl);
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!userId) {
      return;
    }

    const validation = validateProfileForm({
      fullName,
      phoneNumber,
      gender,
      email,
      preferredLanguage,
    });

    if (!validation.isValid) {
      Alert.alert(t('requiredFields'));
      return;
    }

    try {
      setLoading(true);
      await saveUserProfile({
        id: userId,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        gender,
        email: email.trim(),
        preferredLanguage,
        photoUrl,
        createdAt: profile?.createdAt,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.photoRow}>
        {photoUrl ? <Image source={{uri: photoUrl}} style={styles.photo} /> : null}
        <AppButton
          onPress={handlePickPhoto}
          title={photoUrl ? t('changPhoto') : t('selectPhoto')}
          variant="secondary"
          style={styles.photoButton}
          loading={uploadingPhoto}
        />
      </View>
      <AppTextInput
        label={t('fullName')}
        maxLength={50}
        onChangeText={setFullName}
        value={fullName}
      />
      <Text style={styles.helper}>{fullName.length}/50</Text>
      <AppTextInput
        keyboardType="number-pad"
        label={t('phoneNumber')}
        onChangeText={setPhoneNumber}
        value={phoneNumber}
      />
      <GenderPicker
        value={gender}
        onChange={setGender}
      />
      <AppTextInput
        autoCapitalize="none"
        keyboardType="email-address"
        label={t('email')}
        onChangeText={setEmail}
        value={email}
      />
      <LanguagePicker
        value={preferredLanguage}
        onChange={setPreferredLanguage}
      />
      <AppButton loading={loading} onPress={handleSave} title={t('saveProfile')} />
      <AppButton onPress={signOut} title={t('logout')} variant="danger" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  helper: {
    color: '#6b7280',
    marginTop: -10,
  },
  photo: {
    borderRadius: 40,
    height: 80,
    width: 80,
  },
  photoButton: {
    flex: 1,
  },
  photoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
});
