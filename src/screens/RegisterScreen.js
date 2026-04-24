import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
            console.error('Photo pick error:', error);
            Alert.alert('Error', 'Could not access gallery.');
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
            } else {
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
            
            // Success is handled by RootNavigator auth listener
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Screen scroll={false} style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => navigation.navigate('Auth')}
                        >
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.title}>{t('joinUs')}</Text>
                        <Text style={styles.subtitle}>{t('registerSubtitle')}</Text>
                    </View>

                    <View style={styles.formContainer}>
                        {/* Photo Selection Section */}
                        <View style={styles.photoContainer}>
                            <PhotoPicker 
                                photoUrl={photoUrl} 
                                onPick={handlePickPhoto} 
                                required 
                                loading={uploadingPhoto}
                            />
                        </View>

                        {/* Personal Information Group */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="person-circle-outline" size={20} color="#6b7280" />
                                <Text style={styles.sectionTitle}>{t('personalInfo')}</Text>
                            </View>
                            
                            <View style={styles.inputCard}>
                                <AppTextInput 
                                    label={t('fullName')} 
                                    maxLength={50} 
                                    onChangeText={setFullName} 
                                    value={fullName}
                                    placeholder="Juan Pérez"
                                    icon="person"
                                />
                                <View style={styles.divider} />
                                <AppTextInput 
                                    keyboardType="number-pad" 
                                    label={t('phoneNumber')} 
                                    onChangeText={setPhoneNumber} 
                                    value={phoneNumber}
                                    placeholder="300 123 4567"
                                    icon="call"
                                />
                                <View style={styles.divider} />
                                <GenderPicker value={gender} onChange={setGender}/>
                            </View>
                        </View>

                        {/* Account Information Group */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
                                <Text style={styles.sectionTitle}>Account Details</Text>
                            </View>

                            <View style={styles.inputCard}>
                                <AppTextInput 
                                    autoCapitalize="none" 
                                    keyboardType="email-address" 
                                    label={t('email')} 
                                    onChangeText={setEmail} 
                                    value={email}
                                    placeholder="tu@correo.com"
                                    icon="mail"
                                />
                                <View style={styles.divider} />
                                <AppTextInput 
                                    label={t('password')} 
                                    onChangeText={setPassword} 
                                    secureTextEntry 
                                    value={password}
                                    placeholder="••••••••"
                                    icon="key"
                                />
                            </View>
                        </View>

                        {/* App Preferences */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="settings-outline" size={20} color="#6b7280" />
                                <Text style={styles.sectionTitle}>{t('appPreferences')}</Text>
                            </View>
                            <View style={styles.inputCard}>
                                <LanguagePicker value={preferredLanguage} onChange={setPreferredLanguage}/>
                            </View>
                        </View>

                        <AppButton 
                            loading={loading} 
                            onPress={handleRegister} 
                            title={t('register')}
                            style={styles.registerButton}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>{t('alreadyHaveAccount')}</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Auth')}>
                                <Text style={styles.loginLink}>{t('login')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 8,
        lineHeight: 24,
    },
    formContainer: {
        paddingHorizontal: 24,
    },
    photoContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginLeft: 4,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 24,
        padding: 8,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginHorizontal: 16,
    },
    registerButton: {
        height: 60,
        borderRadius: 20,
        marginTop: 40,
        backgroundColor: '#111827',
        elevation: 4,
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        gap: 8,
    },
    footerText: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: '500',
    },
    loginLink: {
        color: '#111827',
        fontSize: 15,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
