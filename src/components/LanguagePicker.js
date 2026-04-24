import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function LanguagePicker({ value, onChange, error }) {
    const { t, i18n } = useTranslation();

    const handleSelect = (code) => {
        i18n.changeLanguage(code);
        onChange(code);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('language')}</Text>
            <View style={styles.row}>
                <Pressable 
                    onPress={() => handleSelect('es')} 
                    style={[styles.btn, value === 'es' && styles.btnActive]}
                >
                    <Ionicons 
                        name="language" 
                        size={16} 
                        color={value === 'es' ? '#111827' : '#9ca3af'} 
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.btnText, value === 'es' && styles.btnTextActive]}>
                        {t('spanish')}
                    </Text>
                </Pressable>
                <View style={styles.verticalDivider} />
                <Pressable 
                    onPress={() => handleSelect('en')} 
                    style={[styles.btn, value === 'en' && styles.btnActive]}
                >
                    <Ionicons 
                        name="globe-outline" 
                        size={16} 
                        color={value === 'en' ? '#111827' : '#9ca3af'} 
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.btnText, value === 'en' && styles.btnTextActive]}>
                        {t('english')}
                    </Text>
                </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    label: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        padding: 4,
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    btnActive: {
        backgroundColor: '#ffffff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    btnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9ca3af',
    },
    btnTextActive: {
        color: '#111827',
    },
    verticalDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#e5e7eb',
    },
    error: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: 4,
    },
});
