import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
export function AppButton({ title, onPress, disabled, loading, variant = 'primary', style, testID }) {
    return (<Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} testID={testID} style={({ pressed }) => [
            styles.button,
            styles[variant],
            (disabled || loading) && styles.disabled,
            pressed && styles.pressed,
            style,
        ]}>
      {loading ? (<ActivityIndicator color="#ffffff"/>) : (<Text style={styles.text}>{title}</Text>)}
    </Pressable>);
}
const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        borderRadius: 8,
        minHeight: 48,
        justifyContent: 'center',
        paddingHorizontal: 18,
    },
    primary: {
        backgroundColor: '#111827',
    },
    secondary: {
        backgroundColor: '#2563eb',
    },
    danger: {
        backgroundColor: '#dc2626',
    },
    disabled: {
        opacity: 0.5,
    },
    pressed: {
        opacity: 0.85,
    },
    text: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});
