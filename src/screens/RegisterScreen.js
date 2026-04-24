import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
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
        try {
            const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
            const uri = result.assets?.[0]?.uri;
            if (uri) {
                setPhotoUrl(uri);
            }
        } catch (error) {
            Alert.alert('Error', 'No pudimos acceder a tu galería.');
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

    return (
      <Screen scroll={false} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{t('joinUs')}</Text>
            <Text style={styles.subtitle}>{t('registerSubtitle')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.photoSection}>
              <PhotoPicker photoUrl={photoUrl} onPick={handlePickPhoto} required loading={uploadingPhoto}/>
            </View>

            <View style={styles.inputWrapper}>
              <AppTextInput 
                label={t('fullName')} 
                maxLength={50} 
                onChangeText={setFullName} 
                value={fullName}
                placeholder="Juan Pérez"
              />
            </View>

            <View style={styles.inputWrapper}>
              <AppTextInput 
                keyboardType="number-pad" 
                label={t('phoneNumber')} 
                onChangeText={setPhoneNumber} 
                value={phoneNumber}
                placeholder="300 123 4567"
              />
            </View>

            <View style={styles.inputWrapper}>
              <GenderPicker value={gender} onChange={setGender}/>
            </View>

            <View style={styles.inputWrapper}>
              <AppTextInput 
                autoCapitalize="none" 
                keyboardType="email-address" 
                label={t('email')} 
                onChangeText={setEmail} 
                value={email}
                placeholder="tu@correo.com"
              />
            </View>

            <View style={styles.inputWrapper}>
              <AppTextInput 
                label={t('password')} 
                onChangeText={setPassword} 
                secureTextEntry 
                value={password}
                placeholder="Mínimo 6 caracteres"
              />
            </View>

            <View style={styles.inputWrapper}>
              <LanguagePicker value={preferredLanguage} onChange={setPreferredLanguage}/>
            </View>

            <AppButton 
              loading={loading} 
              onPress={handleRegister} 
              title={t('register')}
              style={styles.registerButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>{t('login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    scrollContent: {
        flexGrow: 1,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 25,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111827',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 5,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        borderRadius: 25,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    inputWrapper: {
        marginBottom: 12,
    },
    registerButton: {
        height: 55,
        borderRadius: 15,
        marginTop: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
        gap: 8,
        paddingBottom: 20,
    },
    footerText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '500',
    },
    loginLink: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
