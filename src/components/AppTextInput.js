import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function AppTextInput({ label, error, style, icon, ...props }) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={[
                styles.inputWrapper, 
                error && styles.inputError,
                props.multiline && { alignItems: 'flex-start', paddingTop: 12 }
            ]}>
                {icon && (
                    <Ionicons 
                        name={icon} 
                        size={20} 
                        color="#9ca3af" 
                        style={styles.icon} 
                    />
                )}
                <TextInput 
                    placeholderTextColor="#9ca3af" 
                    style={[styles.input, style]} 
                    {...props}
                />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    label: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        minHeight: 48,
    },
    icon: {
        marginRight: 10,
        marginLeft: 4,
    },
    input: {
        flex: 1,
        color: '#111827',
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 8,
    },
    inputError: {
        borderBottomColor: '#dc2626',
    },
    error: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: 2,
    },
});
