import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Alert, StyleSheet, Text, View, Image, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { VehicleSelector } from '@/components/VehicleSelector';
import { env } from '@/config/env';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
    setDestination, setEstimate, setOrigin, setSelectedVehicle,
    selectOrigin, selectDestination, selectEstimate, selectSelectedVehicle, selectEstimatedFare
} from '@/store/slices/tripSlice';
import { getRouteEstimate } from '@/services/googleMapsService';
import { createTrip } from '@/services/tripService';
import { createNearbyDriverLocation } from '@/utils/driverSimulation';

const { width } = Dimensions.get('window');
const PICKUP_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835955.png';
const DESTINATION_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835977.png';

export function HomeScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    
    const userId = useAppSelector(state => state.auth.userId);
    const origin = useAppSelector(selectOrigin);
    const destination = useAppSelector(selectDestination);
    const estimate = useAppSelector(selectEstimate);
    const selectedVehicle = useAppSelector(selectSelectedVehicle);
    const baseFare = useAppSelector(selectEstimatedFare);

    const { location, requestLocation } = useCurrentLocation();
    const [loading, setLoading] = useState(false);
    const [extraTip, setExtraTip] = useState(0);

    const totalFare = useMemo(() => baseFare + extraTip, [baseFare, extraTip]);

    const updateRoute = useCallback(async (start, end) => {
        setLoading(true);
        try {
            const nextEstimate = await getRouteEstimate(start, end);
            dispatch(setEstimate(nextEstimate));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    const handleLocationSelect = useCallback((type, data, details) => {
        if (!details) return;
        const loc = { latitude: details.geometry.location.lat, longitude: details.geometry.location.lng, address: data.description };
        if (type === 'origin') {
            dispatch(setOrigin(loc));
            if (destination) updateRoute(loc, destination);
        } else {
            dispatch(setDestination(loc));
            if (origin) updateRoute(origin, loc);
        }
    }, [dispatch, origin, destination, updateRoute]);

    const handleRequestRide = useCallback(async () => {
        if (!userId || !origin || !destination || !estimate) return;
        try {
            setLoading(true);
            const tripId = await createTrip({
                userId, origin, destination,
                distanceKm: estimate.distanceKm,
                durationMinutes: estimate.durationMinutes,
                vehicleCategory: selectedVehicle,
                estimatedFare: totalFare,
                tip: extraTip,
                status: 'requested',
                driverLocation: createNearbyDriverLocation(origin),
            });
            navigation.navigate('TripTracking', { tripId });
        } catch (error) {
            Alert.alert('Error', t('tripCreateError'));
        } finally {
            setLoading(false);
        }
    }, [userId, origin, destination, estimate, selectedVehicle, totalFare, extraTip, navigation, t]);

    const handleCustomTip = useCallback(() => {
        Alert.prompt(
            "Monto Personalizado",
            "Ingresa el valor extra que deseas ofrecer al conductor",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Aplicar", 
                    onPress: (value) => {
                        const amount = parseInt(value);
                        if (!isNaN(amount) && amount >= 0) {
                            setExtraTip(amount);
                        } else {
                            Alert.alert("Error", "Ingresa un valor numérico válido");
                        }
                    }
                }
            ],
            "plain-text",
            extraTip > 0 ? extraTip.toString() : "",
            "number-pad"
        );
    }, [extraTip]);

    useEffect(() => { requestLocation(); }, [requestLocation]);

    useEffect(() => {
        if (location && !origin) dispatch(setOrigin(location));
    }, [location, origin, dispatch]);

    return (
      <Screen scroll={false}>
        <View style={styles.container}>
          <MapSection origin={origin} destination={destination} />
          
          <Animated.View entering={FadeInUp.delay(200)} style={styles.searchOverlay}>
            <View style={styles.inputCard}>
               <AddressInput label={t('whereToPick')} icon="radio-button-on" iconColor="#10b981" value={origin?.address} onSelect={(d, det) => handleLocationSelect('origin', d, det)} />
               <View style={styles.divider} />
               <AddressInput label={t('whereToGo')} icon="location" iconColor="#ef4444" value={destination?.address} onSelect={(d, det) => handleLocationSelect('destination', d, det)} />
            </View>
          </Animated.View>

          <View style={styles.bottomCardContainer}>
            <RidePanel 
              estimate={estimate}
              selectedVehicle={selectedVehicle}
              totalFare={totalFare}
              extraTip={extraTip}
              loading={loading}
              onVehicleChange={v => dispatch(setSelectedVehicle(v))}
              onTipChange={setExtraTip}
              onCustomTip={handleCustomTip}
              onRequest={handleRequestRide}
            />
          </View>
        </View>
      </Screen>
    );
}

function MapSection({ origin, destination }) {
    return (
        <MapView 
            provider={PROVIDER_GOOGLE} 
            style={styles.map} 
            region={origin ? {
                latitude: origin.latitude,
                longitude: origin.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            } : undefined}
            customMapStyle={mapStyle}
        >
            {origin && <Marker coordinate={origin}><Image source={{ uri: PICKUP_ICON }} style={styles.markerIcon} /></Marker>}
            {destination && <Marker coordinate={destination}><Image source={{ uri: DESTINATION_ICON }} style={styles.markerIcon} /></Marker>}
            {origin && destination && (
                <MapViewDirections 
                    apikey={env.googleMapsApiKey} 
                    destination={destination} 
                    origin={origin} 
                    strokeColor="#111827" 
                    strokeWidth={4}
                />
            )}
        </MapView>
    );
}

function RidePanel({ estimate, selectedVehicle, totalFare, extraTip, loading, onVehicleChange, onTipChange, onCustomTip, onRequest }) {
    const { t } = useTranslation();
    const tipAmounts = [0, 2000, 5000, 10000];

    if (!estimate) return (
        <Animated.View entering={FadeInDown} style={styles.panelCard}>
            <View style={styles.waitingContainer}>
                <Text style={styles.waitingTitle}>¡Pide tu Didi ahora!</Text>
                <Text style={styles.waitingSubtitle}>Selecciona un destino para ver precios</Text>
            </View>
        </Animated.View>
    );

    return (
        <Animated.View layout={Layout.springify()} entering={FadeInDown.duration(600)} style={styles.panelCard}>
            <View style={styles.routeStatsRow}>
                <View style={styles.routeStat}>
                    <Ionicons name="navigate" size={16} color="#6b7280" />
                    <Text style={styles.routeStatText}>{estimate.distanceKm} km</Text>
                </View>
                <View style={styles.routeStat}>
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text style={styles.routeStatText}>{estimate.durationMinutes} min</Text>
                </View>
            </View>

            <VehicleSelector value={selectedVehicle} onChange={onVehicleChange} />
            
            <View style={styles.tipContainer}>
                <View style={styles.tipHeader}>
                    <Text style={styles.tipLabel}>Propina de incentivo</Text>
                    <Text style={styles.tipIncentive}>Aumenta la prioridad de tu solicitud</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tipOptions}>
                    {tipAmounts.map(amt => (
                        <TouchableOpacity key={amt} style={[styles.tipBtn, extraTip === amt && styles.tipBtnActive]} onPress={() => onTipChange(amt)}>
                            <Text style={[styles.tipText, extraTip === amt && styles.tipTextActive]}>{amt === 0 ? 'Estándar' : `+$${amt/1000}k`}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={[styles.customTipBtn, extraTip > 10000 && styles.tipBtnActive]} onPress={onCustomTip}>
                        <Ionicons name="add-circle" size={18} color={extraTip > 10000 ? "white" : "#ff7d00"} />
                        <Text style={[styles.customTipText, extraTip > 10000 && { color: 'white' }]}>{extraTip > 10000 ? `$${extraTip/1000}k` : 'Otro'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <View style={styles.footer}>
                <View>
                    <Text style={styles.totalFareLabel}>Precio total</Text>
                    <Text style={styles.totalValue}>${totalFare.toLocaleString('es-CO')}</Text>
                </View>
                <AppButton loading={loading} onPress={onRequest} title="Pedir Viaje" style={styles.requestButton} />
            </View>
        </Animated.View>
    );
}

function AddressInput({ label, icon, iconColor, onSelect }) {
    return (
        <View style={styles.addressRow}>
            <Ionicons name={icon} size={18} color={iconColor} style={{ marginRight: 10 }} />
            <GooglePlacesAutocomplete 
                debounce={300} fetchDetails placeholder={label} onPress={onSelect}
                query={{ key: env.googleMapsApiKey, language: 'es' }} 
                styles={{ textInput: styles.autocompleteInput, container: { flex: 1 }, listView: { zIndex: 100 } }}
            />
        </View>
    );
}

const mapStyle = [
    { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] },
    { "featureType": "administrative.neighborhood", "stylers": [{ "visibility": "off" }] }
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    map: { flex: 1 },
    searchOverlay: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 10 },
    inputCard: { backgroundColor: 'white', borderRadius: 24, padding: 15, elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
    addressRow: { flexDirection: 'row', alignItems: 'center' },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12, marginLeft: 28 },
    autocompleteInput: { fontSize: 16, fontWeight: '700', color: '#111827', backgroundColor: 'transparent' },
    bottomCardContainer: { position: 'absolute', bottom: 115, left: 15, right: 15, zIndex: 10 },
    panelCard: { backgroundColor: 'white', borderRadius: 32, padding: 24, elevation: 25, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30 },
    waitingContainer: { alignItems: 'center', paddingVertical: 10 },
    waitingTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 5 },
    waitingSubtitle: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
    routeStatsRow: { flexDirection: 'row', gap: 15, marginBottom: 15, backgroundColor: '#f9fafb', padding: 10, borderRadius: 12, alignSelf: 'flex-start' },
    routeStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    routeStatText: { fontSize: 13, fontWeight: '800', color: '#4b5563' },
    tipContainer: { marginTop: 15 },
    tipLabel: { fontSize: 13, fontWeight: '900', color: '#111827', textTransform: 'uppercase' },
    tipIncentive: { fontSize: 11, color: '#6b7280', fontWeight: '600', marginTop: 1 },
    tipHeader: { marginBottom: 12 },
    tipOptions: { flexDirection: 'row', gap: 10, paddingRight: 20 },
    tipBtn: { minWidth: 75, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 16, borderWidth: 2, borderColor: '#f3f4f6', alignItems: 'center', backgroundColor: '#fff' },
    tipBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
    tipText: { fontSize: 12, fontWeight: '800', color: '#374151' },
    tipTextActive: { color: 'white' },
    customTipBtn: { flexDirection: 'row', alignItems: 'center', minWidth: 90, paddingHorizontal: 12, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#ff7d00', gap: 5, backgroundColor: '#fff7ed' },
    customTipText: { fontSize: 12, fontWeight: '900', color: '#ff7d00' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    totalFareLabel: { fontSize: 12, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' },
    totalValue: { fontSize: 28, fontWeight: '900', color: '#111827' },
    requestButton: { width: width * 0.45, height: 55, borderRadius: 18 },
    markerIcon: { width: 45, height: 45, resizeMode: 'contain' },
});
