import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Alert, StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { SearchingDriver } from '@/components/SearchingDriver';
import { listenToTrip, updateTripStatus, updateDriverLocation } from '@/services/tripService';
import { moveTowardsTarget } from '@/utils/driverSimulation';

const { width } = Dimensions.get('window');
const PICKUP_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835955.png';
const DESTINATION_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835977.png';
const CAR_ICON = 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png';

const AnimatedMarker = Animated.createAnimatedComponent(Marker);

export function TripTrackingScreen({ route, navigation }) {
    const { t } = useTranslation();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [offers, setOffers] = useState([]);
    const offersShown = useRef(false);

    const carLat = useSharedValue(0);
    const carLng = useSharedValue(0);

    const statusFlags = useMemo(() => ({
        isRequested: trip?.status === 'requested',
        isCompleted: trip?.status === 'completed',
        isInProgress: trip?.status === 'in_progress',
        isArriving: trip?.status === 'arriving',
        isAssigned: trip?.status === 'driver_assigned',
    }), [trip?.status]);

    const carAnimatedProps = useAnimatedProps(() => ({
        coordinate: { latitude: carLat.value, longitude: carLng.value },
    }));

    const handleStatusUpdate = useCallback(async (newStatus, extra = {}) => {
        if (!trip?.id || loading) return;
        try {
            setLoading(true);
            await updateTripStatus(trip.id, newStatus, extra);
        } catch (err) {
            Alert.alert('Error', t('operationFailed'));
        } finally {
            setLoading(false);
        }
    }, [trip?.id, loading, t]);

    useEffect(() => {
        const unsubscribe = listenToTrip(route.params.tripId, (updatedTrip) => {
            if (!updatedTrip) return;
            setTrip(updatedTrip);
            
            if (updatedTrip.status === 'requested' && !offersShown.current) {
                offersShown.current = true;
                setTimeout(() => {
                    setOffers([
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
                    ]);
                }, 3000);
            }

            if (updatedTrip.driverLocation) {
                carLat.value = withTiming(updatedTrip.driverLocation.latitude, { duration: 4000 });
                carLng.value = withTiming(updatedTrip.driverLocation.longitude, { duration: 4000 });
            }
        });
        return () => {
            unsubscribe();
            offersShown.current = false;
        };
    }, [route.params.tripId]);

    useEffect(() => {
        if (!trip || ['completed', 'cancelled', 'requested'].includes(trip.status)) return;
        const timer = setInterval(async () => {
            const currentLoc = trip.driverLocation ?? trip.origin;
            const target = trip.status === 'in_progress' ? trip.destination : trip.origin;
            const nextLoc = moveTowardsTarget(currentLoc, target, 0.001);
            try {
                const distToTarget = Math.sqrt(Math.pow(nextLoc.latitude - target.latitude, 2) + Math.pow(nextLoc.longitude - target.longitude, 2));
                if (distToTarget < 0.001 && trip.status === 'driver_assigned') {
                    await updateTripStatus(trip.id, 'arriving');
                } else {
                    await updateDriverLocation(trip.id, nextLoc);
                }
            } catch (err) { console.warn(err); }
        }, 4000);
        return () => clearInterval(timer);
    }, [trip?.id, trip?.status]);

    if (!trip) return <Screen><View style={styles.loader}><Text>Cargando viaje...</Text></View></Screen>;

    return (
        <Screen scroll={false}>
            <View style={styles.container}>
                <Animated.View entering={FadeInUp.delay(300)} style={styles.statusHeader}>
                    <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                    <Text style={styles.statusHeaderText}>{t(`status_${trip.status}`)} • Encriptado</Text>
                </Animated.View>

                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    region={{
                        latitude: trip.driverLocation?.latitude ?? trip.origin.latitude,
                        longitude: trip.driverLocation?.longitude ?? trip.origin.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                    }}
                    customMapStyle={mapStyle}
                >
                    <Marker coordinate={trip.origin}><Image source={{ uri: PICKUP_ICON }} style={styles.markerIcon} /></Marker>
                    <Marker coordinate={trip.destination}><Image source={{ uri: DESTINATION_ICON }} style={styles.markerIcon} /></Marker>
                    {trip.driverLocation && (
                        <AnimatedMarker animatedProps={carAnimatedProps}><Image source={{ uri: CAR_ICON }} style={styles.carIcon} /></AnimatedMarker>
                    )}
                </MapView>

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
                                onStart={() => handleStatusUpdate('in_progress')}
                                onComplete={() => handleStatusUpdate('completed')}
                            />
                        )}
                    </Animated.View>
                </View>
            </View>
        </Screen>
    );
}

function OfferList({ offers, onAccept }) {
    if (offers.length === 0) return <SearchingDriver />;
    return (
        <View style={styles.offersContainer}>
            <Text style={styles.offersTitle}>Conductores Disponibles</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
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
                        <View style={styles.priceBadge}>
                            <Text style={styles.offerPrice}>${off.price.toLocaleString()}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

function DriverStatusCard({ trip, flags, loading, onStart, onComplete }) {
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

            {flags.isArriving && (
                <Animated.View entering={FadeInUp} style={styles.arrivalNotice}>
                    <Ionicons name="notifications" size={18} color="#854d0e" />
                    <Text style={styles.arrivalText}>El conductor ha llegado al punto de recogida</Text>
                </Animated.View>
            )}

            <View style={styles.divider} />

            <View style={styles.actions}>
                {flags.isArriving && <AppButton loading={loading} onPress={onStart} title="Iniciar Viaje" style={styles.mainActionBtn} />}
                {flags.isInProgress && <AppButton loading={loading} onPress={onComplete} title="Finalizar Viaje" style={styles.mainActionBtn} />}
                {(flags.isAssigned || flags.isArriving) && (
                    <TouchableOpacity style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancelar Viaje</Text></TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const mapStyle = [{ "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }, { "lightness": 17 }] }];

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statusHeader: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, flexDirection: 'row', alignItems: 'center', elevation: 10, zIndex: 10 },
    statusHeaderText: { marginLeft: 8, fontSize: 13, fontWeight: '800', color: '#111827' },
    bottomCardContainer: { 
        position: 'absolute', 
        bottom: 115, // Consistencia con la HomeScreen para evitar el Tab Bar
        left: 15, 
        right: 15, 
        zIndex: 10 
    },
    panelCard: { backgroundColor: 'white', borderRadius: 32, padding: 24, elevation: 25 },
    offersContainer: { gap: 10 },
    offersTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 10 },
    offerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 15, borderRadius: 20, marginBottom: 10 },
    offerDriverPhoto: { width: 50, height: 50, borderRadius: 25 },
    offerDriverName: { fontSize: 16, fontWeight: '800' },
    offerDetail: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    ratingText: { fontSize: 11, color: '#374151', fontWeight: '700' },
    priceBadge: { backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    offerPrice: { color: 'white', fontWeight: '900', fontSize: 14 },
    driverCard: { gap: 12 },
    driverHeader: { flexDirection: 'row', alignItems: 'center' },
    driverPhoto: { width: 60, height: 60, borderRadius: 30 },
    driverName: { fontSize: 20, fontWeight: '900' },
    vehicleText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
    arrivalNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fefce8', padding: 12, borderRadius: 15, gap: 10, borderWidth: 1, borderColor: '#fef08a' },
    arrivalText: { fontSize: 12, fontWeight: '700', color: '#854d0e', flex: 1 },
    callActions: { flexDirection: 'row' },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
    divider: { height: 1, backgroundColor: '#f3f4f6' },
    actions: { gap: 10 },
    mainActionBtn: { height: 56, borderRadius: 18 },
    cancelBtn: { alignSelf: 'center', padding: 10 },
    cancelBtnText: { color: '#9ca3af', fontWeight: '700', fontSize: 13 },
    markerIcon: { width: 45, height: 45, resizeMode: 'contain' },
    carIcon: { width: 42, height: 42, resizeMode: 'contain' },
});
