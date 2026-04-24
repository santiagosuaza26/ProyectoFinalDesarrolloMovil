import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

const genders = [
    { value: 'female', labelKey: 'female', icon: 'woman' },
    { value: 'male', labelKey: 'male', icon: 'man' },
    { value: 'non_binary', labelKey: 'nonBinary', icon: 'transgender' },
    { value: 'prefer_not_to_say', labelKey: 'preferNotToSay', icon: 'help-circle' },
];

export function GenderPicker({ value, onChange, error }) {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('gender')}</Text>
            <View style={styles.grid}>
                {genders.map((item) => {
                    const isSelected = value === item.value;
                    return (
                        <Pressable
                            key={item.value}
                            onPress={() => onChange(item.value)}
                            style={[
                                styles.chip,
                                isSelected && styles.chipActive
                            ]}
                        >
                            <Ionicons 
                                name={item.icon} 
                                size={18} 
                                color={isSelected ? '#111827' : '#9ca3af'} 
                                style={{ marginRight: 8 }}
                            />
                            <Text style={[
                                styles.chipText,
                                isSelected && styles.chipTextActive
                            ]}>
                                {t(item.labelKey)}
                            </Text>
                        </Pressable>
                    );
                })}
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
        marginBottom: 12,
        marginLeft: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    chipActive: {
        backgroundColor: '#ffffff',
        borderColor: '#111827',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9ca3af',
    },
    chipTextActive: {
        color: '#111827',
        fontWeight: '700',
    },
    error: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: 6,
    },
});
