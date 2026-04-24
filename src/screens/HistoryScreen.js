import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
    useEffect(() => {
        if (!userId) {
            return undefined;
        }
        return listenToUserTrips(userId, setTrips);
    }, [userId]);
    return (<Screen scroll={false} style={styles.screen}>
      <FlatList contentContainerStyle={styles.list} data={trips} keyExtractor={item => item.id} ListEmptyComponent={<Text style={styles.empty}>{t('noTrips')}</Text>} renderItem={({ item }) => (<Pressable onPress={() => navigation.navigate('TripDetail', { trip: item })} style={styles.card}>
            <Text style={styles.title}>{item.destination.address}</Text>
            <Text style={styles.text}>
              {t('distance')}: {item.distanceKm} km
            </Text>
            <Text style={styles.text}>
              {t('duration')}: {item.durationMinutes} min
            </Text>
            <View style={styles.row}>
              <Text style={styles.status}>{item.status}</Text>
              <Text style={styles.fare}>${item.estimatedFare.toFixed(2)}</Text>
            </View>
          </Pressable>)}/>
    </Screen>);
}
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        gap: 6,
        padding: 14,
    },
    empty: {
        color: '#6b7280',
        textAlign: 'center',
    },
    fare: {
        color: '#111827',
        fontWeight: '900',
    },
    list: {
        gap: 12,
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    screen: {
        flex: 1,
    },
    status: {
        color: '#2563eb',
        fontWeight: '800',
    },
    text: {
        color: '#374151',
    },
    title: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '900',
    },
});
