import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from './AppButton';
const languages = [
    { value: 'es', labelKey: 'spanish' },
    { value: 'en', labelKey: 'english' },
];
export function LanguagePicker({ value, onChange, error }) {
    const { t } = useTranslation();
    return (<View style={styles.container}>
      <Text style={styles.label}>{t('language')}</Text>
      <View style={styles.row}>
        {languages.map(lang => (<AppButton key={lang.value} onPress={() => onChange(lang.value)} title={t(lang.labelKey)} variant={value === lang.value ? 'primary' : 'secondary'} style={styles.button}/>))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>);
}
const styles = StyleSheet.create({
    container: {
        gap: 6,
    },
    label: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flex: 1,
        minHeight: 48,
    },
    error: {
        color: '#dc2626',
        fontSize: 12,
    },
});
