import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function LanguagePicker({ value, onChange, error }) {
    const { t, i18n } = useTranslation();

    const handleSelect = (code) => {
        i18n.changeLanguage(code);
        onChange(code);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('language') || 'Idioma'}</Text>
            <View style={styles.row}>
                <Pressable 
                    onPress={() => handleSelect('es')} 
                    style={[styles.btn, value === 'es' && styles.btnActive]}
                >
                    <Text style={[styles.btnText, value === 'es' && styles.btnTextActive]}>
                        {t('spanish') || 'Español'}
                    </Text>
                </Pressable>
                <Pressable 
                    onPress={() => handleSelect('en')} 
                    style={[styles.btn, value === 'en' && styles.btnActive]}
                >
                    <Text style={[styles.btnText, value === 'en' && styles.btnTextActive]}>
                        {t('english') || 'Inglés'}
                    </Text>
                </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
    },
    label: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 4,
    },
    btn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    btnActive: {
        backgroundColor: '#ffffff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    btnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9ca3af',
    },
    btnTextActive: {
        color: '#111827',
    },
    error: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: 4,
    },
});
