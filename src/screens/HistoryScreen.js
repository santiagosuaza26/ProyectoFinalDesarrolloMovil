import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { useAppSelector } from '@/store/hooks';
import { listenToUserTrips } from '@/services/tripService';

const PICKUP_ICON = 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png'; // Icono pequeño de punto
const DEST_ICON = 'https://cdn-icons-png.flaticon.com/512/1483/1483336.png'; // Icono pequeño de destino

export function HistoryScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { userId } = useAppSelector(state => state.auth);
    const [trips, setTrips] = useState([]);

    useEffect(() => {
        if (!userId) return undefined;
        return listenToUserTrips(userId, setTrips);
    }, [userId]);

    const renderTripItem = React.useCallback(({ item }) => {
        const isCancelled = item.status === 'cancelled';
        
        return (
          <Pressable 
            onPress={() => navigation.navigate('TripDetail', { trip: item })} 
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.statusBadge, isCancelled && styles.statusBadgeCancelled]}>
                <Text style={[styles.statusText, isCancelled && styles.statusTextCancelled]}>
                  {t(item.status) || item.status}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : ''}
              </Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routeLineContainer}>
                <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                <View style={styles.line} />
                <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
              </View>
              
              <View style={styles.addressContainer}>
                <Text style={styles.addressText} numberOfLines={1}>{item.origin.address}</Text>
                <Text style={styles.addressText} numberOfLines={1}>{item.destination.address}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>{item.distanceKm} km</Text>
                <View style={styles.statsDivider} />
                <Text style={styles.statsText}>{item.durationMinutes} min</Text>
              </View>
              <Text style={styles.priceText}>
                ${(item.finalFare || item.estimatedFare).toLocaleString('es-CO')}
              </Text>
            </View>
          </Pressable>
        );
    }, [navigation, t]);

    return (
      <Screen scroll={false} style={styles.screen}>
        <View style={styles.header}>
           <Text style={styles.headerTitle}>{t('history')}</Text>
        </View>
        <FlatList 
          contentContainerStyle={styles.list} 
          data={trips} 
          keyExtractor={item => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076432.png' }} 
                style={styles.emptyIcon} 
              />
              <Text style={styles.emptyTitle}>{t('noTrips')}</Text>
              <Text style={styles.emptySubtitle}>Tus viajes aparecerán aquí una vez que los completes.</Text>
            </View>
          } 
          renderItem={renderTripItem}
        />
      </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        backgroundColor: '#ffffff',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
    },
    list: {
        padding: 16,
        paddingBottom: 120, 
        gap: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    statusBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeCancelled: {
        backgroundColor: '#fee2e2',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#15803d',
        textTransform: 'uppercase',
    },
    statusTextCancelled: {
        color: '#b91c1c',
    },
    dateText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    routeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 15,
    },
    routeLineContainer: {
        alignItems: 'center',
        paddingVertical: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    line: {
        width: 1,
        flex: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 4,
    },
    addressContainer: {
        flex: 1,
        gap: 12,
    },
    addressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statsText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    statsDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#d1d5db',
    },
    priceText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        marginBottom: 20,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});
