import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
export function AppTextInput({ label, error, style, ...props }) {
    return (<View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#6b7280" style={[styles.input, error && styles.inputError, style]} {...props}/>
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
    input: {
        backgroundColor: '#ffffff',
        borderColor: '#d1d5db',
        borderRadius: 8,
        borderWidth: 1,
        color: '#111827',
        fontSize: 16,
        minHeight: 48,
        paddingHorizontal: 12,
    },
    inputError: {
        borderColor: '#dc2626',
    },
    error: {
        color: '#dc2626',
        fontSize: 12,
    },
});
