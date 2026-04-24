import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Alert, StyleSheet, Text, View, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useStripe } from '@stripe/stripe-react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { listenToTrip, updateDriverLocation, updateTripPayment, updateTripStatus } from '@/services/tripService';
import { createPaymentIntent } from '@/services/paymentService';
import { moveTowardsTarget } from '@/utils/driverSimulation';

const AnimatedMarker = Animated.createAnimatedComponent(Marker);

const PICKUP_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835955.png';
const DESTINATION_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835977.png';
const CAR_ICON = 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png';
const SEARCHING_LOTTIE = 'https://assets9.lottiefiles.com/packages/lf20_7zS7vS.json';

export function TripTrackingScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [trip, setTrip] = useState();
    const [loading, setLoading] = useState(false);

    // Bottom Sheet setup
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['25%', '50%'], []);

    // Reanimated values for smooth car movement
    const carLat = useSharedValue(0);
    const carLng = useSharedValue(0);

    const carAnimatedProps = useAnimatedProps(() => {
        return {
            coordinate: {
                latitude: carLat.value,
                longitude: carLng.value,
            },
        };
    });

    useEffect(() => {
        return listenToTrip(route.params.tripId, (updatedTrip) => {
            setTrip(updatedTrip);
            if (updatedTrip?.driverLocation) {
                carLat.value = withTiming(updatedTrip.driverLocation.latitude, {
                    duration: 4500,
                    easing: Easing.linear,
                });
                carLng.value = withTiming(updatedTrip.driverLocation.longitude, {
                    duration: 4500,
                    easing: Easing.linear,
                });
            }
        });
    }, [route.params.tripId, carLat, carLng]);

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
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: trip.origin.latitude,
            longitude: trip.origin.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={trip.origin} title="Pickup">
            <Image source={{ uri: PICKUP_ICON }} style={styles.markerIcon} />
          </Marker>
          <Marker coordinate={trip.destination} title="Destination">
            <Image source={{ uri: DESTINATION_ICON }} style={styles.markerIcon} />
          </Marker>
          {trip.driverLocation ? (
            <AnimatedMarker animatedProps={carAnimatedProps} title="Driver">
               <Image source={{ uri: CAR_ICON }} style={styles.carIcon} />
            </AnimatedMarker>
          ) : null}
        </MapView>

        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          backgroundStyle={styles.bottomSheetBackground}
        >
          <View style={styles.panel}>
            <View style={styles.statusContainer}>
              <View style={styles.statusTextContainer}>
                <Text style={styles.title}>
                  {t('status')}: {t(trip.status)}
                </Text>
                <Text style={styles.text}>
                  {t('estimatedFare')}: ${trip.estimatedFare.toFixed(2)}
                </Text>
              </View>
              {trip.status !== 'completed' && (
                <LottieView
                  source={{ uri: SEARCHING_LOTTIE }}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
              )}
            </View>

            <View style={styles.actions}>
              {trip.status !== 'completed' ? (
                <AppButton onPress={handleCompleteRide} title={t('completeRide')}/>
              ) : (
                <AppButton
                  disabled={trip.paymentStatus === 'paid'}
                  loading={loading}
                  onPress={handlePay}
                  title={t('payWithStripe')}
                />
              )}
              <AppButton
                onPress={() => updateTripStatus(trip.id, 'cancelled')}
                title={t('cancelRide')}
                variant="danger"
              />
            </View>
          </View>
        </BottomSheet>
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
    bottomSheetBackground: {
        borderRadius: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    panel: {
        flex: 1,
        padding: 20,
        gap: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusTextContainer: {
        flex: 1,
    },
    lottie: {
        width: 80,
        height: 80,
    },
    actions: {
        gap: 12,
    },
    text: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 4,
    },
    title: {
        color: '#111827',
        fontSize: 22,
        fontWeight: '900',
        textTransform: 'capitalize',
    },
    markerIcon: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
    carIcon: {
        width: 45,
        height: 45,
        resizeMode: 'contain',
    },
});
