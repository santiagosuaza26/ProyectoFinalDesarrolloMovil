import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
export function Screen({ children, scroll = true, style }) {
    if (!scroll) {
        return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
    }
    return (<SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, style]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>);
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f3f4f6',
        flex: 1,
    },
    content: {
        gap: 16,
        padding: 18,
    },
});
