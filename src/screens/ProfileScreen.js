import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/AppButton';
import { AppTextInput } from '@/components/AppTextInput';
import { GenderPicker } from '@/components/GenderPicker';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Screen } from '@/components/Screen';
import { useAppSelector } from '@/store/hooks';
import { isLocalAuthMode, signOut } from '@/services/authService';
import { saveUserProfile } from '@/services/userService';
import { uploadProfilePhoto } from '@/services/storageService';
import { validateProfileForm } from '@/utils/validation';

export function ProfileScreen() {
    const { t } = useTranslation();
    const { userId, profile } = useAppSelector(state => state.auth);
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('prefer_not_to_say');
    const [email, setEmail] = useState('');
    const [preferredLanguage, setPreferredLanguage] = useState('es');
    const [photoUrl, setPhotoUrl] = useState();
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useEffect(() => {
        if (!profile) return;
        setFullName(profile.fullName || '');
        setPhoneNumber(profile.phoneNumber || '');
        setGender(profile.gender || 'prefer_not_to_say');
        setEmail(profile.email || '');
        setPreferredLanguage(profile.preferredLanguage || 'es');
        setPhotoUrl(profile.photoUrl);
    }, [profile]);

    async function handlePickPhoto() {
        if (!userId) return;
        try {
            const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
            const uri = result.assets?.[0]?.uri;
            if (uri) {
                setUploadingPhoto(true);
                const nextPhotoUrl = isLocalAuthMode() ? uri : await uploadProfilePhoto(userId, uri);
                setPhotoUrl(nextPhotoUrl);
            }
        } catch (error) {
            Alert.alert('Error', 'No pudimos subir tu foto.');
        } finally {
            setUploadingPhoto(false);
        }
    }

    async function handleSave() {
        if (!userId) return;
        const validation = validateProfileForm({ fullName, phoneNumber, gender, email, preferredLanguage });
        if (!validation.isValid) {
            Alert.alert('Faltan datos', 'Por favor completa todos los campos obligatorios.');
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
            Alert.alert('Éxito', 'Perfil actualizado correctamente.');
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar el perfil.');
        } finally {
            setLoading(false);
        }
    }

    return (
      <Screen scroll={false} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: photoUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
                style={styles.photo}
              />
              <TouchableOpacity 
                style={styles.editBadge} 
                onPress={handlePickPhoto}
                disabled={uploadingPhoto}
              >
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1827/1827933.png' }} 
                  style={styles.editIcon}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{fullName || t('user')}</Text>
            <Text style={styles.userEmail}>{email || t('noEmail')}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('personalInfo')}</Text>
            
            <View style={styles.inputWrapper}>
              <AppTextInput 
                label={t('fullName')} 
                maxLength={50} 
                onChangeText={setFullName} 
                value={fullName}
                placeholder="Ej. Juan Pérez"
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
              <AppTextInput 
                autoCapitalize="none" 
                keyboardType="email-address" 
                label={t('email')} 
                onChangeText={setEmail} 
                value={email}
                placeholder="usuario@correo.com"
              />
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('appPreferences')}</Text>
            <LanguagePicker value={preferredLanguage} onChange={setPreferredLanguage}/>
          </View>

          {/* Actions Section */}
          <View style={styles.actions}>
            <AppButton 
              loading={loading} 
              onPress={handleSave} 
              title={t('saveProfile')}
              style={styles.saveButton}
            />
            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
              <Text style={styles.logoutText}>{t('logout')}</Text>
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
        paddingBottom: 120, // Aumentado para dar espacio al menú flotante
    },
    header: {
        backgroundColor: '#ffffff',
        paddingVertical: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 20,
    },
    photoContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#f3f4f6',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#111827',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    editIcon: {
        width: 16,
        height: 16,
        tintColor: '#ffffff',
    },
    userName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111827',
    },
    userEmail: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        marginBottom: 10,
    },
    actions: {
        paddingHorizontal: 16,
        marginTop: 10,
        gap: 15,
    },
    saveButton: {
        height: 55,
        borderRadius: 15,
    },
    logoutButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 16,
    },
});
