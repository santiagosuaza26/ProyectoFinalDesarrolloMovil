import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Alert, StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { useStripe } from '@stripe/stripe-react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { SearchingDriver } from '@/components/SearchingDriver';
import { listenToTrip, updateTripStatus, updateDriverLocation, updateTripPayment } from '@/services/tripService';
import { createPaymentIntent } from '@/services/paymentService';
import { moveTowardsTarget } from '@/utils/driverSimulation';
import { useAppDispatch } from '@/store/hooks';
import { resetTripRequest } from '@/store/slices/tripSlice';
import { CommonActions } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const PICKUP_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835955.png';
const DESTINATION_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835977.png';
const CAR_ICON = 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png';

const AnimatedMarker = Animated.createAnimatedComponent(Marker);

// Función auxiliar para calcular distancia entre coordenadas (en Km)
const getDistance = (lat1, lon1, lat2, lng2) => {
    const R = 6371; // Radio de la tierra
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export function TripTrackingScreen({ route, navigation }) {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [offers, setOffers] = useState([]);
    const offersShown = useRef(false);

    const carLat = useSharedValue(0);
    const carLng = useSharedValue(0);

    // 1. useMemo para estados booleanos
    const statusFlags = useMemo(() => ({
        isRequested: trip?.status === 'requested',
        isCompleted: trip?.status === 'completed',
        isInProgress: trip?.status === 'in_progress',
        isArriving: trip?.status === 'arriving',
        isAssigned: trip?.status === 'driver_assigned',
        isPaid: trip?.paymentStatus === 'paid'
    }), [trip?.status, trip?.paymentStatus]);

    // 2. useMemo para cálculos de distancia y tiempo dinámicos
    const tripStats = useMemo(() => {
        if (!trip || !trip.driverLocation) return { distance: 0, time: 0 };
        
        const target = statusFlags.isInProgress ? trip.destination : trip.origin;
        const dist = getDistance(
            trip.driverLocation.latitude, 
            trip.driverLocation.longitude, 
            target.latitude, 
            target.longitude
        );
        
        // Estimación simple: 40km/h promedio (1.5 min por km)
        return {
            distance: dist.toFixed(1),
            time: Math.round(dist * 1.5) || 1
        };
    }, [trip?.driverLocation, trip?.destination, trip?.origin, statusFlags.isInProgress]);

    const carAnimatedProps = useAnimatedProps(() => ({
        coordinate: { latitude: carLat.value, longitude: carLng.value },
    }));

    const navigateHome = useCallback(() => {
        dispatch(resetTripRequest());
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            })
        );
    }, [dispatch, navigation]);

    const handleStatusUpdate = useCallback(async (newStatus, extra = {}) => {
        if (!trip?.id || loading) return;
        try {
            setLoading(true);
            await updateTripStatus(trip.id, newStatus, extra);
            if (newStatus === 'cancelled') navigateHome();
        } catch (err) {
            Alert.alert('Error', t('operationFailed'));
        } finally {
            setLoading(false);
        }
    }, [trip?.id, loading, navigateHome, t]);

    const handlePayment = useCallback(async (method) => {
        if (!trip) return;
        setLoading(true);
        try {
            if (method === 'cash') {
                await updateTripPayment(trip.id, 'paid', trip.finalFare || trip.estimatedFare);
                Alert.alert('¡Pago Exitoso!', 'El conductor ha recibido el pago.', [{ text: 'OK', onPress: navigateHome }]);
            } else {
                const { paymentIntent, ephemeralKey, customer } = await createPaymentIntent(trip.finalFare || trip.estimatedFare);
                const { error } = await initPaymentSheet({
                    merchantDisplayName: "Didi Clone",
                    customerId: customer,
                    customerEphemeralKeySecret: ephemeralKey,
                    paymentIntentClientSecret: paymentIntent,
                });
                if (!error) {
                    const { error: presentError } = await presentPaymentSheet();
                    if (!presentError) {
                        await updateTripPayment(trip.id, 'paid', trip.finalFare || trip.estimatedFare);
                        Alert.alert('¡Pago Exitoso!', 'Tu pago ha sido procesado.', [{ text: 'OK', onPress: navigateHome }]);
                    }
                }
            }
        } catch (err) {
            Alert.alert('Error', 'No se pudo procesar el pago.');
        } finally {
            setLoading(false);
        }
    }, [trip, navigateHome, initPaymentSheet, presentPaymentSheet]);

    useEffect(() => {
        const unsubscribe = listenToTrip(route.params.tripId, (updatedTrip) => {
            if (!updatedTrip) return;
            setTrip(updatedTrip);
            if (updatedTrip.status === 'requested' && !offersShown.current) {
                offersShown.current = true;
                setTimeout(() => {
                    setOffers([
                        { id: 'off-1', driverName: 'Carlos Mario', rating: '4.9', price: updatedTrip.estimatedFare, vehicle: 'Kia Picanto • Blanco', plate: 'ABC-123', photo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', distance: 0.8, time: 3 },
                        { id: 'off-2', driverName: 'Andrés Felipe', rating: '4.8', price: updatedTrip.estimatedFare + 2000, vehicle: 'Renault Logan • Gris', plate: 'XYZ-789', photo: 'https://cdn-icons-png.flaticon.com/512/4128/4128176.png', distance: 1.5, time: 5 },
                    ]);
                }, 2000);
            }
            if (updatedTrip.driverLocation) {
                carLat.value = withTiming(updatedTrip.driverLocation.latitude, { duration: 3500 });
                carLng.value = withTiming(updatedTrip.driverLocation.longitude, { duration: 3500 });
            }
        });
        return () => unsubscribe();
    }, [route.params.tripId]);

    useEffect(() => {
        if (!trip || ['completed', 'cancelled', 'requested'].includes(trip.status)) return;
        const timer = setInterval(async () => {
            const currentLoc = trip.driverLocation ?? trip.origin;
            const target = trip.status === 'in_progress' ? trip.destination : trip.origin;
            const nextLoc = moveTowardsTarget(currentLoc, target, 0.002);
            try {
                const distToTarget = Math.sqrt(Math.pow(nextLoc.latitude - target.latitude, 2) + Math.pow(nextLoc.longitude - target.longitude, 2));
                if (distToTarget < 0.0005 && trip.status === 'driver_assigned') {
                    await updateTripStatus(trip.id, 'arriving');
                } else if (distToTarget < 0.0005 && trip.status === 'in_progress') {
                    await updateTripStatus(trip.id, 'completed');
                } else {
                    await updateDriverLocation(trip.id, nextLoc);
                }
            } catch (err) {}
        }, 3500);
        return () => clearInterval(timer);
    }, [trip?.id, trip?.status, trip?.driverLocation]);

    if (!trip) return <Screen><View style={styles.loader}><Text>Cargando viaje...</Text></View></Screen>;

    return (
        <Screen scroll={false}>
            <View style={styles.container}>
                <Animated.View entering={FadeInUp.delay(300)} style={styles.statusHeader}>
                    <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                    <Text style={styles.statusHeaderText}>{t(`status_${trip.status}`)} • Protegido</Text>
                </Animated.View>

                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    region={{
                        latitude: trip.driverLocation?.latitude ?? trip.origin.latitude,
                        longitude: trip.driverLocation?.longitude ?? trip.origin.longitude,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.015,
                    }}
                    customMapStyle={mapStyle}
                >
                    <Marker coordinate={trip.origin}><Image source={{ uri: PICKUP_ICON }} style={styles.markerIcon} /></Marker>
                    <Marker coordinate={trip.destination}><Image source={{ uri: DESTINATION_ICON }} style={styles.markerIcon} /></Marker>
                    {trip.driverLocation && (
                        <AnimatedMarker animatedProps={carAnimatedProps}><Image source={{ uri: CAR_ICON }} style={styles.carIcon} /></AnimatedMarker>
                    )}
                </MapView>

                {statusFlags.isCompleted && !statusFlags.isPaid && (
                    <Animated.View entering={FadeInDown.springify()} style={styles.paymentModal}>
                        <View style={styles.paymentHeader}>
                            <Ionicons name="checkmark-circle" size={50} color="#10b981" />
                            <Text style={styles.paymentTitle}>¡Has llegado a tu destino!</Text>
                            <Text style={styles.paymentSubtitle}>Por favor selecciona tu método de pago</Text>
                        </View>
                        <View style={styles.fareContainer}>
                            <Text style={styles.fareLabel}>Total a pagar</Text>
                            <Text style={styles.fareAmount}>${(trip.finalFare || trip.estimatedFare).toLocaleString('es-CO')}</Text>
                        </View>
                        <View style={styles.paymentActions}>
                            <TouchableOpacity disabled={loading} style={[styles.methodBtn, styles.cashBtn]} onPress={() => handlePayment('cash')}>
                                <Ionicons name="cash" size={24} color="#15803d" />
                                <Text style={styles.methodText}>Efectivo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity disabled={loading} style={[styles.methodBtn, styles.cardBtn]} onPress={() => handlePayment('card')}>
                                <Ionicons name="card" size={24} color="white" />
                                <Text style={[styles.methodText, { color: 'white' }]}>Tarjeta / Stripe</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                {!statusFlags.isCompleted && (
                    <View style={styles.bottomCardContainer}>
                        <Animated.View entering={FadeInDown} style={styles.panelCard}>
                            {statusFlags.isRequested ? (
                                <OfferList 
                                    offers={offers} 
                                    onAccept={(off) => handleStatusUpdate('driver_assigned', { 
                                        driverName: off.driverName, 
                                        vehiclePlate: off.plate, 
                                        vehicleModel: off.vehicle, 
                                        finalFare: off.price,
                                        driverRating: off.rating
                                    })} 
                                />
                            ) : (
                                <DriverStatusCard 
                                    trip={trip} 
                                    flags={statusFlags} 
                                    loading={loading} 
                                    stats={tripStats}
                                    onStart={() => handleStatusUpdate('in_progress')} 
                                    onCancel={() => handleStatusUpdate('cancelled')} 
                                />
                            )}
                        </Animated.View>
                    </View>
                )}
            </View>
        </Screen>
    );
}

function OfferList({ offers, onAccept }) {
    if (offers.length === 0) return <SearchingDriver />;
    return (
        <View style={styles.offersContainer}>
            <Text style={styles.offersTitle}>Conductores Disponibles</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
                {offers.map(off => (
                    <TouchableOpacity key={off.id} style={styles.offerItem} onPress={() => onAccept(off)}>
                        <Image source={{ uri: off.photo }} style={styles.offerDriverPhoto} />
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={styles.offerDriverName}>{off.driverName}</Text>
                            <Text style={styles.offerDetail}>{off.vehicle}</Text>
                            <View style={styles.row}>
                                <Ionicons name="star" size={12} color="#fbbf24" />
                                <Text style={styles.ratingText}>{off.rating} • {off.distance} km • {off.time} min</Text>
                            </View>
                        </View>
                        <View style={styles.priceBadge}><Text style={styles.offerPrice}>${off.price.toLocaleString()}</Text></View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

function DriverStatusCard({ trip, flags, loading, stats, onStart, onCancel }) {
    return (
        <View style={styles.driverCard}>
            <View style={styles.driverHeader}>
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.driverPhoto} />
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.driverName}>{trip.driverName}</Text>
                    <Text style={styles.vehicleText}>{trip.vehiclePlate} • {trip.vehicleModel}</Text>
                    <View style={styles.row}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={styles.ratingText}>{trip.driverRating || '4.9'}</Text>
                    </View>
                </View>
                <View style={styles.callActions}>
                    <TouchableOpacity style={styles.circleBtn}><Ionicons name="chatbubble" size={20} color="#111827" /></TouchableOpacity>
                    <TouchableOpacity style={[styles.circleBtn, { marginLeft: 10 }]}><Ionicons name="call" size={20} color="#111827" /></TouchableOpacity>
                </View>
            </View>

            {/* PANEL DE CÁLCULOS DINÁMICOS */}
            {!flags.isCompleted && (
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="navigate-circle" size={20} color="#ff7d00" />
                        <View>
                            <Text style={styles.statValue}>{stats.distance} km</Text>
                            <Text style={styles.statLabel}>{flags.isInProgress ? 'Para llegar' : 'Para recogerte'}</Text>
                        </View>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="time" size={20} color="#ff7d00" />
                        <View>
                            <Text style={styles.statValue}>{stats.time} min</Text>
                            <Text style={styles.statLabel}>Est. de llegada</Text>
                        </View>
                    </View>
                </View>
            )}

            {flags.isArriving && (
                <Animated.View entering={FadeInUp} style={styles.arrivalNotice}>
                    <Ionicons name="notifications" size={18} color="#854d0e" />
                    <Text style={styles.arrivalText}>¡Tu conductor ha llegado al punto!</Text>
                </Animated.View>
            )}

            <View style={styles.divider} />

            <View style={styles.actions}>
                {flags.isArriving && <AppButton loading={loading} onPress={onStart} title="Iniciar Viaje" />}
                {flags.isInProgress && <View style={styles.inProgressBadge}><Text style={styles.inProgressText}>Viaje en curso a destino...</Text></View>}
                {!flags.isInProgress && <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancelar Viaje</Text></TouchableOpacity>}
            </View>
        </View>
    );
}

const mapStyle = [{ "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }] }];

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statusHeader: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, flexDirection: 'row', alignItems: 'center', elevation: 10, zIndex: 10 },
    statusHeaderText: { marginLeft: 8, fontSize: 13, fontWeight: '800', color: '#111827' },
    bottomCardContainer: { position: 'absolute', bottom: 115, left: 15, right: 15, zIndex: 10 },
    panelCard: { backgroundColor: 'white', borderRadius: 32, padding: 24, elevation: 25 },
    paymentModal: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.55, backgroundColor: 'white', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, elevation: 30, alignItems: 'center', zIndex: 100 },
    paymentHeader: { alignItems: 'center', marginBottom: 20 },
    paymentTitle: { fontSize: 22, fontWeight: '900', marginTop: 10 },
    paymentSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 5 },
    fareContainer: { backgroundColor: '#f9fafb', padding: 20, borderRadius: 20, width: '100%', alignItems: 'center', marginVertical: 20 },
    fareLabel: { fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase' },
    fareAmount: { fontSize: 36, fontWeight: '900', color: '#111827' },
    paymentActions: { width: '100%', gap: 15 },
    methodBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 18, gap: 10 },
    cashBtn: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
    cardBtn: { backgroundColor: '#111827' },
    methodText: { fontSize: 16, fontWeight: '800', color: '#15803d' },
    offersContainer: { gap: 10 },
    offersTitle: { fontSize: 18, fontWeight: '900', marginBottom: 10 },
    offerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 15, borderRadius: 20, marginBottom: 10 },
    offerDriverPhoto: { width: 50, height: 50, borderRadius: 25 },
    offerDriverName: { fontSize: 16, fontWeight: '800' },
    offerDetail: { fontSize: 12, color: '#6b7280' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    ratingText: { fontSize: 11, color: '#374151', fontWeight: '700' },
    priceBadge: { backgroundColor: '#111827', padding: 8, borderRadius: 12 },
    offerPrice: { color: 'white', fontWeight: '900' },
    driverCard: { gap: 12 },
    driverHeader: { flexDirection: 'row', alignItems: 'center' },
    driverPhoto: { width: 60, height: 60, borderRadius: 30 },
    driverName: { fontSize: 20, fontWeight: '900' },
    vehicleText: { fontSize: 13, color: '#6b7280' },
    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 18, padding: 15, marginVertical: 5 },
    statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    statValue: { fontSize: 15, fontWeight: '900', color: '#111827' },
    statLabel: { fontSize: 10, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' },
    statDivider: { width: 1, height: 30, backgroundColor: '#e5e7eb', marginHorizontal: 15 },
    arrivalNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fefce8', padding: 12, borderRadius: 15, gap: 10, borderWidth: 1, borderColor: '#fef08a' },
    arrivalText: { fontSize: 12, fontWeight: '700', color: '#854d0e', flex: 1 },
    callActions: { flexDirection: 'row' },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
    divider: { height: 1, backgroundColor: '#f3f4f6' },
    actions: { gap: 10 },
    cancelBtn: { alignSelf: 'center', padding: 10 },
    cancelBtnText: { color: '#9ca3af', fontWeight: '700' },
    inProgressBadge: { backgroundColor: '#eff6ff', padding: 15, borderRadius: 15, alignItems: 'center' },
    inProgressText: { color: '#1d4ed8', fontWeight: '800' },
    markerIcon: { width: 45, height: 45, resizeMode: 'contain' },
    carIcon: { width: 42, height: 42, resizeMode: 'contain' },
});
