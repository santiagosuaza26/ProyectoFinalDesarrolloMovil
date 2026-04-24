import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { useAppSelector } from '@/store/hooks';
import { listenToUserTrips } from '@/services/tripService';

export function HistoryScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { userId } = useAppSelector(state => state.auth);
    const [trips, setTrips] = useState([]);

    // 1. useEffect: Suscripción a datos en tiempo real
    useEffect(() => {
        if (!userId) return;
        const unsubscribe = listenToUserTrips(userId, setTrips);
        return () => unsubscribe();
    }, [userId]);

    // 2. useCallback: Renderizado optimizado para FlatList
    const renderTripItem = useCallback(({ item }) => (
        <TripCard 
            trip={item} 
            onPress={() => navigation.navigate('TripDetail', { trip: item })} 
        />
    ), [navigation]);

    return (
      <Screen scroll={false} style={styles.screen}>
        <View style={styles.header}>
           <Text style={styles.headerTitle}>{t('history')}</Text>
        </View>
        <FlatList 
          contentContainerStyle={styles.list} 
          data={trips} 
          keyExtractor={item => item.id}
          renderItem={renderTripItem}
          ListEmptyComponent={<EmptyState />}
        />
      </Screen>
    );
}

// Sub-componentes modulares
function TripCard({ trip, onPress }) {
    const { t } = useTranslation();
    const isCancelled = trip.status === 'cancelled';
    
    return (
        <Pressable onPress={onPress} style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, isCancelled && styles.statusBadgeCancelled]}>
                    <Text style={[styles.statusText, isCancelled && styles.statusTextCancelled]}>{t(trip.status)}</Text>
                </View>
                <Text style={styles.dateText}>{trip.createdAt?.toDate?.().toLocaleDateString()}</Text>
            </View>
            <Text style={styles.addressText} numberOfLines={1}>● {trip.origin.address}</Text>
            <Text style={styles.addressText} numberOfLines={1}>📍 {trip.destination.address}</Text>
            
            {trip.driverName && (
                <View style={styles.driverBadge}>
                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.driverBadgePhoto} />
                    <Text style={styles.driverBadgeText}>{trip.driverName}</Text>
                </View>
            )}

            <View style={styles.cardFooter}>
                <Text style={styles.statsText}>{trip.distanceKm} km • {trip.durationMinutes} min</Text>
                <Text style={styles.priceText}>${(trip.finalFare || trip.estimatedFare).toLocaleString()}</Text>
            </View>
        </Pressable>
    );
}

function EmptyState() {
    const { t } = useTranslation();
    return (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{t('noTrips')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 22, fontWeight: '900' },
    list: { padding: 16, gap: 15 },
    card: { backgroundColor: 'white', borderRadius: 18, padding: 16, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    statusBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusBadgeCancelled: { backgroundColor: '#fee2e2' },
    statusText: { fontSize: 10, fontWeight: '800', color: '#15803d' },
    statusTextCancelled: { color: '#b91c1c' },
    dateText: { fontSize: 11, color: '#6b7280' },
    addressText: { fontSize: 13, fontWeight: '600', marginBottom: 5 },
    driverBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 8, alignSelf: 'flex-start' },
    driverBadgePhoto: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
    driverBadgeText: { fontSize: 12, fontWeight: '700', color: '#374151' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, marginTop: 10 },
    statsText: { fontSize: 12, color: '#6b7280' },
    priceText: { fontSize: 16, fontWeight: '900' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyTitle: { fontWeight: '700', color: '#9ca3af' }
});
