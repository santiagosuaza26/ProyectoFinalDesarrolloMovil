import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Alert, StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Vibration } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useStripe } from '@stripe/stripe-react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { SearchingDriver } from '@/components/SearchingDriver';
import { listenToTrip, updateDriverLocation, updateTripPayment, updateTripStatus } from '@/services/tripService';
import { createPaymentIntent } from '@/services/paymentService';
import { moveTowardsTarget } from '@/utils/driverSimulation';

const AnimatedMarker = Animated.createAnimatedComponent(Marker);

const PICKUP_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835955.png';
const DESTINATION_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835977.png';
const CAR_ICON = 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png';

export function TripTrackingScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [trip, setTrip] = useState();
    const [loading, setLoading] = useState(false);
    const [offers, setOffers] = useState([]);
    const mapRef = useRef(null);
    const lastStatus = useRef(null);

    // Reanimated values for smooth car movement
    const carLat = useSharedValue(0);
    const carLng = useSharedValue(0);

    const carAnimatedProps = useAnimatedProps(() => ({
        coordinate: {
            latitude: carLat.value,
            longitude: carLng.value,
        },
    }));

    // 1. Logic for simulated offers
    useEffect(() => {
        return listenToTrip(route.params.tripId, (updatedTrip) => {
            if (!updatedTrip) return;
            setTrip(updatedTrip);
            
            if (updatedTrip.status === 'requested' && offers.length === 0) {
                setTimeout(() => {
                    const simulatedOffers = [
                        { 
                            id: 'off-1', 
                            driverName: 'Carlos Mario', 
                            rating: '4.9', 
                            price: updatedTrip.estimatedFare, 
                            vehicle: 'Kia Picanto • Blanco',
                            plate: 'ABC-123',
                            photo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                            distance: 0.8,
                            time: 3
                        },
                        { 
                            id: 'off-2', 
                            driverName: 'Andrés Felipe', 
                            rating: '4.8', 
                            price: updatedTrip.estimatedFare + 2000, 
                            vehicle: 'Renault Logan • Gris',
                            plate: 'XYZ-789',
                            photo: 'https://cdn-icons-png.flaticon.com/512/4128/4128176.png',
                            distance: 1.5,
                            time: 5
                        },
                    ];
                    setOffers(simulatedOffers);
                }, 3000);
            }

            if (updatedTrip.driverLocation) {
                carLat.value = withTiming(updatedTrip.driverLocation.latitude, { duration: 4500, easing: Easing.linear });
                carLng.value = withTiming(updatedTrip.driverLocation.longitude, { duration: 4500, easing: Easing.linear });
            }

            // 2. Logic for modern notifications based on status change
            if (lastStatus.current !== updatedTrip.status) {
                handleStatusChange(updatedTrip.status);
                lastStatus.current = updatedTrip.status;
            }
        });
    }, [route.params.tripId, carLat, carLng, offers.length]);

    const handleStatusChange = (status) => {
        try {
            switch(status) {
                case 'arriving':
                    Vibration.vibrate([0, 500, 200, 500]);
                    Alert.alert('¡Tu conductor llegó!', 'Carlos Mario te está esperando en el punto de recogida.');
                    break;
                case 'in_progress':
                    Alert.alert('Viaje Iniciado', 'El viaje hacia tu destino ha comenzado. ¡Disfruta el trayecto!');
                    break;
                case 'completed':
                    Alert.alert('Hemos llegado', 'Has llegado a tu destino. Por favor procede con el pago.');
                    break;
            }
        } catch (e) {
            console.warn('Vibration or Alert error:', e);
        }
    };

    // 3. Driver Movement Simulation Logic
    useEffect(() => {
        if (!trip || ['completed', 'cancelled', 'requested'].includes(trip.status)) return;

        const timer = setInterval(async () => {
            const currentLoc = trip.driverLocation ?? trip.origin;
            const target = trip.status === 'in_progress' ? trip.destination : trip.origin;
            
            const nextLoc = moveTowardsTarget(currentLoc, target, 0.001);
            
            try {
                await updateDriverLocation(trip.id, nextLoc);
                const distToTarget = Math.sqrt(Math.pow(nextLoc.latitude - target.latitude, 2) + Math.pow(nextLoc.longitude - target.longitude, 2));
                
                if (distToTarget < 0.001) {
                    if (trip.status === 'driver_assigned') {
                        await updateTripStatus(trip.id, 'arriving');
                    }
                }
            } catch (err) {
                console.error('Simulation update error:', err);
            }
        }, 4000);

        return () => clearInterval(timer);
    }, [trip]);

    async function handleAcceptOffer(offer) {
        if (!trip?.id) return;
        try {
            setLoading(true);
            await updateTripStatus(trip.id, 'driver_assigned', {
                driverName: offer.driverName,
                vehiclePlate: offer.plate,
                vehicleModel: offer.vehicle,
                finalFare: offer.price,
                driverRating: offer.rating
            });
            await updateDriverLocation(trip.id, {
                latitude: trip.origin.latitude + 0.008,
                longitude: trip.origin.longitude - 0.008
            });
            setOffers([]);
        } catch (error) {
            console.error('Error accepting offer:', error);
            Alert.alert('Error', 'No pudimos aceptar la oferta.');
        } finally {
            setLoading(false);
        }
    }

    async function handleStartTrip() {
        if (!trip?.id) return;
        try {
            setLoading(true);
            await updateTripStatus(trip.id, 'in_progress');
        } catch (err) {
            console.error('Error starting trip:', err);
            Alert.alert('Error', 'No se pudo iniciar el viaje.');
        } finally {
            setLoading(false);
        }
    }

    async function handleCompleteRide() {
        if (!trip?.id) return;
        try {
            setLoading(true);
            await updateTripStatus(trip.id, 'completed', { finalFare: trip.estimatedFare });
        } catch (err) {
            console.error('Error completing trip:', err);
            Alert.alert('Error', 'No se pudo finalizar el viaje.');
        } finally {
            setLoading(false);
        }
    }

    async function handleCancelTrip() {
        if (!trip?.id) return;
        try {
            setLoading(true);
            await updateTripStatus(trip.id, 'cancelled');
        } catch (err) {
            console.error('Error cancelling trip:', err);
            Alert.alert('Error', 'No se pudo cancelar el viaje.');
        } finally {
            setLoading(false);
        }
    }

    async function handlePay() {
        if (!trip?.id) return;
        try {
            setLoading(true);
            const clientSecret = await createPaymentIntent(trip.estimatedFare);
            const initResult = await initPaymentSheet({
                merchantDisplayName: 'Didiclone',
                paymentIntentClientSecret: clientSecret,
            });
            if (initResult.error) throw new Error(initResult.error.message);
            const paymentResult = await presentPaymentSheet();
            if (paymentResult.error) throw new Error(paymentResult.error.message);
            
            await updateTripPayment(trip.id, 'paid', trip.estimatedFare);
            Alert.alert(t('paymentSuccessful'));
            navigation.navigate('MainTabs', { screen: 'History' });
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert(t('paymentFailed'), error.message);
        } finally {
            setLoading(false);
        }
    }

    if (!trip) return <Screen><View style={styles.loader}><Text>Cargando viaje...</Text></View></Screen>;

    const isRequested = trip.status === 'requested';
    const isCompleted = trip.status === 'completed';
    const isInProgress = trip.status === 'in_progress';
    const isArriving = trip.status === 'arriving';

    return (
        <Screen scroll={false}>
            <View style={styles.container}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                        latitude: trip.origin.latitude,
                        longitude: trip.origin.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >
                    <Marker coordinate={trip.origin} title="Recogida">
                        <Image source={{ uri: PICKUP_ICON }} style={styles.markerIcon} />
                    </Marker>
                    <Marker coordinate={trip.destination} title="Destino">
                        <Image source={{ uri: DESTINATION_ICON }} style={styles.markerIcon} />
                    </Marker>
                    {trip.driverLocation && (
                        <AnimatedMarker animatedProps={carAnimatedProps} title="Conductor">
                            <Image source={{ uri: CAR_ICON }} style={styles.carIcon} />
                        </AnimatedMarker>
                    )}
                </MapView>

                <View style={styles.bottomCardContainer}>
                    <View style={styles.panelCard}>
                        {isRequested ? (
                            offers.length === 0 ? (
                                <SearchingDriver />
                            ) : (
                                <View style={styles.offersContainer}>
                                    <Text style={styles.offersTitle}>Conductores cercanos</Text>
                                    <ScrollView style={styles.offersList} showsVerticalScrollIndicator={false}>
                                        {offers.map((offer) => (
                                            <TouchableOpacity key={offer.id} style={styles.offerItem} onPress={() => handleAcceptOffer(offer)}>
                                                <Image source={{ uri: offer.photo }} style={styles.offerDriverPhoto} />
                                                <View style={styles.offerInfo}>
                                                    <Text style={styles.offerDriverName}>{offer.driverName}</Text>
                                                    <Text style={styles.offerDistance}>{offer.distance} km • {offer.time} min</Text>
                                                    <View style={styles.ratingRow}>
                                                        <Ionicons name="star" size={12} color="#fbbf24" />
                                                        <Text style={styles.offerRating}>{offer.rating}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.offerPriceContainer}>
                                                    <Text style={styles.offerPrice}>${offer.price.toLocaleString('es-CO')}</Text>
                                                    <View style={styles.acceptBadge}><Text style={styles.acceptText}>Aceptar</Text></View>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )
                        ) : (
                            <View style={styles.driverCard}>
                                <View style={styles.driverHeader}>
                                    <View style={styles.driverInfo}>
                                        <View style={styles.statusBadge}>
                                            <Text style={styles.statusBadgeText}>{t(trip.status)}</Text>
                                        </View>
                                        <Text style={styles.driverName}>{trip.driverName}</Text>
                                        <Text style={styles.vehicleInfoText}>{trip.vehiclePlate} • {trip.vehicleModel}</Text>
                                    </View>
                                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.driverPhoto} />
                                </View>

                                {isArriving && (
                                    <View style={styles.arrivalNotice}>
                                        <Ionicons name="notifications" size={20} color="#111827" />
                                        <Text style={styles.arrivalText}>El conductor ha llegado al punto de recogida</Text>
                                    </View>
                                )}

                                <View style={styles.actions}>
                                    {isArriving && <AppButton loading={loading} onPress={handleStartTrip} title="Iniciar Viaje" />}
                                    {isInProgress && <AppButton loading={loading} onPress={handleCompleteRide} title="Finalizar Viaje" />}
                                    {isCompleted && (
                                        <AppButton 
                                            disabled={trip.paymentStatus === 'paid'} 
                                            loading={loading} 
                                            onPress={handlePay} 
                                            title={trip.paymentStatus === 'paid' ? "Pagado" : t('payWithStripe')} 
                                        />
                                    )}
                                    {!isInProgress && !isCompleted && (
                                        <AppButton loading={loading} onPress={handleCancelTrip} title={t('cancelRide')} variant="danger" />
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bottomCardContainer: { position: 'absolute', bottom: 110, left: 15, right: 15, zIndex: 10 },
    panelCard: { backgroundColor: 'white', borderRadius: 25, padding: 20, elevation: 15 },
    offersContainer: { maxHeight: 400 },
    offersTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 15, textAlign: 'center' },
    offerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6' },
    offerDriverPhoto: { width: 50, height: 50, borderRadius: 25 },
    offerInfo: { flex: 1, marginLeft: 12 },
    offerDriverName: { fontSize: 15, fontWeight: '800', color: '#111827' },
    offerDistance: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
    offerRating: { fontSize: 12, fontWeight: '700', color: '#374151', marginLeft: 3 },
    offerPriceContainer: { alignItems: 'flex-end', gap: 5 },
    offerPrice: { fontSize: 16, fontWeight: '900', color: '#111827' },
    acceptBadge: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
    acceptText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
    driverCard: { gap: 15 },
    driverHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    driverInfo: { flex: 1 },
    statusBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    statusBadgeText: { fontSize: 12, fontWeight: '800', color: '#111827', textTransform: 'uppercase' },
    driverName: { fontSize: 22, fontWeight: '900', color: '#111827' },
    vehicleInfoText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    driverPhoto: { width: 60, height: 60, borderRadius: 30 },
    arrivalNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fefce8', padding: 12, borderRadius: 12, gap: 10, borderWidth: 1, borderColor: '#fef08a' },
    arrivalText: { fontSize: 13, fontWeight: '700', color: '#854d0e', flex: 1 },
    actions: { marginTop: 10, gap: 10 },
    markerIcon: { width: 40, height: 40, resizeMode: 'contain' },
    carIcon: { width: 45, height: 45, resizeMode: 'contain' },
});
