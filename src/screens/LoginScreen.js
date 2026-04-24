import React, { useState } from 'react';
import { Alert, Text, StyleSheet, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/AppButton';
import { AppTextInput } from '@/components/AppTextInput';
import { Screen } from '@/components/Screen';
import { signIn } from '@/services/authService';

export function LoginScreen({ navigation }) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!email.trim() || !password) {
            Alert.alert(t('requiredFields'));
            return;
        }
        try {
            setLoading(true);
            await signIn(email, password);
        }
        catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Login failed');
        }
        finally {
            setLoading(false);
        }
    }

    return (
      <Screen scroll={false} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png' }} 
                style={styles.logo}
              />
            </View>
            <Text style={styles.title}>{t('appName')}</Text>
            <Text style={styles.welcomeText}>{t('welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
          </View>

          <View style={styles.card}>
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

            <View style={styles.inputWrapper}>
              <AppTextInput 
                label={t('password')} 
                onChangeText={setPassword} 
                secureTextEntry 
                value={password}
                placeholder="••••••••"
              />
            </View>

            <AppButton 
              loading={loading} 
              onPress={handleLogin} 
              title={t('login')}
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('dontHaveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>{t('createAccount')}</Text>
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
        justifyContent: 'center',
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#111827',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    logo: {
        width: 60,
        height: 60,
        tintColor: '#ffffff',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 10,
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#374151',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 5,
    },
    card: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        borderRadius: 25,
        padding: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    inputWrapper: {
        marginBottom: 15,
    },
    loginButton: {
        height: 55,
        borderRadius: 15,
        marginTop: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        gap: 8,
    },
    footerText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '500',
    },
    registerLink: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
