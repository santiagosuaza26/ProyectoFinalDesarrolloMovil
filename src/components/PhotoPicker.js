import React from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function PhotoPicker({ photoUrl, onPick, required, error, loading }) {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                onPress={onPick} 
                style={styles.photoWrapper}
                activeOpacity={0.8}
                disabled={loading}
            >
                {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.photo} />
                ) : (
                    <View style={[styles.photo, styles.placeholder]}>
                        <Ionicons name="person" size={40} color="#9ca3af" />
                    </View>
                )}
                
                <View style={styles.editBadge}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Ionicons name="camera" size={18} color="#ffffff" />
                    )}
                </View>

                {required && !photoUrl && (
                    <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>*</Text>
                    </View>
                )}
            </TouchableOpacity>
            
            <Text style={styles.instructionText}>
                {photoUrl ? t('changPhoto') : t('selectPhoto')}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    photoWrapper: {
        position: 'relative',
    },
    photo: {
        borderRadius: 50,
        height: 100,
        width: 100,
        borderWidth: 3,
        borderColor: '#f3f4f6',
    },
    placeholder: {
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#111827',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    requiredBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ef4444',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    requiredText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    instructionText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    error: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: 4,
    },
});
