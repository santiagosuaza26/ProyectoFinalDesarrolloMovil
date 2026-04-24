import React, {useState} from 'react';
import {Alert, Text, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {AppButton} from '@/components/AppButton';
import {AppTextInput} from '@/components/AppTextInput';
import {Screen} from '@/components/Screen';
import {signIn} from '@/services/authService';
import type {AuthStackParamList} from '@/types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({navigation}: Props) {
  const {t} = useTranslation();
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
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>{t('appName')}</Text>
      <AppTextInput
        autoCapitalize="none"
        keyboardType="email-address"
        label={t('email')}
        onChangeText={setEmail}
        value={email}
      />
      <AppTextInput
        label={t('password')}
        onChangeText={setPassword}
        secureTextEntry
        value={password}
      />
      <AppButton loading={loading} onPress={handleLogin} title={t('login')} />
      <AppButton
        onPress={() => navigation.navigate('Register')}
        title={t('createAccount')}
        variant="secondary"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '900',
  },
});
