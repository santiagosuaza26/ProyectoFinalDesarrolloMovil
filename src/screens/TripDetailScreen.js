import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
export function TripDetailScreen({ route }) {
    const { t } = useTranslation();
    const { trip } = route.params;
    return (<Screen>
      <View style={styles.card}>
        <Text style={styles.title}>{trip.destination.address}</Text>
        <Text style={styles.text}>
          {t('status')}: {trip.status}
        </Text>
        <Text style={styles.text}>
          {t('distance')}: {trip.distanceKm} km
        </Text>
        <Text style={styles.text}>
          {t('duration')}: {trip.durationMinutes} min
        </Text>
        <Text style={styles.text}>Vehicle: {trip.vehicleCategory}</Text>
        <Text style={styles.text}>
          {t('estimatedFare')}: ${trip.estimatedFare.toFixed(2)}
        </Text>
        <Text style={styles.text}>Payment: {trip.paymentStatus}</Text>
      </View>
    </Screen>);
}
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        gap: 10,
        padding: 16,
    },
    text: {
        color: '#374151',
        fontSize: 15,
    },
    title: {
        color: '#111827',
        fontSize: 20,
        fontWeight: '900',
    },
});
