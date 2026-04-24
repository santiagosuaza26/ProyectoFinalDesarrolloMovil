import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useStripe } from '@stripe/stripe-react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { listenToTrip, updateDriverLocation, updateTripPayment, updateTripStatus } from '@/services/tripService';
import { createPaymentIntent } from '@/services/paymentService';
import { moveTowardsTarget } from '@/utils/driverSimulation';
export function TripTrackingScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [trip, setTrip] = useState();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        return listenToTrip(route.params.tripId, setTrip);
    }, [route.params.tripId]);
    useEffect(() => {
        if (!trip || trip.status === 'completed' || trip.status === 'cancelled') {
            return undefined;
        }
        const timer = setInterval(async () => {
            const currentDriverLocation = trip.driverLocation ?? trip.origin;
            const nextDriverLocation = moveTowardsTarget(currentDriverLocation, trip.origin);
            await updateDriverLocation(trip.id, nextDriverLocation);
            if (trip.status === 'requested') {
                await updateTripStatus(trip.id, 'driver_assigned');
            }
            else if (trip.status === 'driver_assigned') {
                await updateTripStatus(trip.id, 'arriving');
            }
        }, 5000);
        return () => clearInterval(timer);
    }, [trip]);
    async function handleCompleteRide() {
        if (!trip) {
            return;
        }
        await updateTripStatus(trip.id, 'completed', { finalFare: trip.estimatedFare });
    }
    async function handlePay() {
        if (!trip) {
            return;
        }
        try {
            setLoading(true);
            const clientSecret = await createPaymentIntent(trip.estimatedFare);
            const initResult = await initPaymentSheet({
                merchantDisplayName: 'Didiclone',
                paymentIntentClientSecret: clientSecret,
            });
            if (initResult.error) {
                throw new Error(initResult.error.message);
            }
            const paymentResult = await presentPaymentSheet();
            if (paymentResult.error) {
                throw new Error(paymentResult.error.message);
            }
            await updateTripPayment(trip.id, 'paid', trip.estimatedFare);
            Alert.alert(t('paymentSuccessful'));
            navigation.navigate('MainTabs', { screen: 'History' });
        }
        catch (error) {
            await updateTripPayment(trip.id, 'failed', trip.estimatedFare);
            Alert.alert(t('paymentFailed'), error instanceof Error ? error.message : undefined);
        }
        finally {
            setLoading(false);
        }
    }
    if (!trip) {
        return (<Screen>
        <Text>Loading...</Text>
      </Screen>);
    }
    return (<Screen scroll={false}>
      <View style={styles.container}>
        <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={{
            latitude: trip.origin.latitude,
            longitude: trip.origin.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        }}>
          <Marker coordinate={trip.origin} title="Pickup"/>
          <Marker coordinate={trip.destination} title="Destination"/>
          {trip.driverLocation ? (<Marker coordinate={trip.driverLocation} title="Driver"/>) : null}
        </MapView>
        <View style={styles.panel}>
          <Text style={styles.title}>
            {t('status')}: {trip.status}
          </Text>
          <Text style={styles.text}>
            {t('estimatedFare')}: ${trip.estimatedFare.toFixed(2)}
          </Text>
          {trip.status !== 'completed' ? (<AppButton onPress={handleCompleteRide} title={t('completeRide')}/>) : (<AppButton disabled={trip.paymentStatus === 'paid'} loading={loading} onPress={handlePay} title={t('payWithStripe')}/>)}
          <AppButton onPress={() => updateTripStatus(trip.id, 'cancelled')} title={t('cancelRide')} variant="danger"/>
        </View>
      </View>
    </Screen>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    panel: {
        backgroundColor: '#ffffff',
        gap: 12,
        padding: 16,
    },
    text: {
        color: '#374151',
        fontWeight: '700',
    },
    title: {
        color: '#111827',
        fontSize: 18,
        fontWeight: '900',
    },
});
