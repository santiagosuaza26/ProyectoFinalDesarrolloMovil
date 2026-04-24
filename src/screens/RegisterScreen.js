import React, { useState } from 'react';
import { Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/AppButton';
import { AppTextInput } from '@/components/AppTextInput';
import { GenderPicker } from '@/components/GenderPicker';
import { LanguagePicker } from '@/components/LanguagePicker';
import { PhotoPicker } from '@/components/PhotoPicker';
import { Screen } from '@/components/Screen';
import { isLocalAuthMode, signUp } from '@/services/authService';
import { saveUserProfile } from '@/services/userService';
import { uploadProfilePhoto } from '@/services/storageService';
import { validateRegistrationForm } from '@/utils/validation';
export function RegisterScreen({ navigation }) {
    const { t } = useTranslation();
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('prefer_not_to_say');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [preferredLanguage, setPreferredLanguage] = useState('es');
    const [photoUrl, setPhotoUrl] = useState();
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    async function handlePickPhoto() {
        setUploadingPhoto(true);
        try {
            const result = await launchImageLibrary({ mediaType: 'photo' });
            const uri = result.assets?.[0]?.uri;
            if (uri) {
                setPhotoUrl(uri);
            }
        }
        finally {
            setUploadingPhoto(false);
        }
    }
    async function handleRegister() {
        const validation = validateRegistrationForm({
            fullName,
            phoneNumber,
            gender,
            email,
            preferredLanguage,
            photoUrl,
        });
        if (!validation.isValid || password.length < 6) {
            const firstError = Object.values(validation.errors)[0] || t('requiredFields');
            Alert.alert(t('requiredFields'), firstError);
            return;
        }
        try {
            setLoading(true);
            const user = await signUp(email, password);
            let uploadedPhotoUrl;
            if (!isLocalAuthMode() && photoUrl && photoUrl.startsWith('file://')) {
                uploadedPhotoUrl = await uploadProfilePhoto(user.uid, photoUrl);
            }
            else {
                uploadedPhotoUrl = photoUrl;
            }
            await saveUserProfile({
                id: user.uid,
                fullName: fullName.trim(),
                phoneNumber: phoneNumber.trim(),
                gender,
                email: email.trim(),
                preferredLanguage,
                photoUrl: uploadedPhotoUrl,
            });
        }
        catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Registration failed');
        }
        finally {
            setLoading(false);
        }
    }
    return (<Screen>
      <PhotoPicker photoUrl={photoUrl} onPick={handlePickPhoto} required loading={uploadingPhoto}/>
      <AppTextInput label={t('fullName')} maxLength={50} onChangeText={setFullName} testID="register-full-name-input" value={fullName}/>
      <AppTextInput keyboardType="number-pad" label={t('phoneNumber')} onChangeText={setPhoneNumber} testID="register-phone-input" value={phoneNumber}/>
      <GenderPicker value={gender} onChange={setGender}/>
      <AppTextInput autoCapitalize="none" keyboardType="email-address" label={t('email')} onChangeText={setEmail} testID="register-email-input" value={email}/>
      <AppTextInput label={t('password')} onChangeText={setPassword} secureTextEntry testID="register-password-input" value={password}/>
      <LanguagePicker value={preferredLanguage} onChange={setPreferredLanguage}/>
      <AppButton loading={loading} onPress={handleRegister} testID="register-submit-button" title={t('register')}/>
      <AppButton onPress={() => navigation.goBack()} testID="register-go-back-button" title={t('login')} variant="secondary"/>
    </Screen>);
}
