import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Alert, StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@gorhom/bottom-sheet';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { VehicleSelector } from '@/components/VehicleSelector';
import { env } from '@/config/env';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setDestination, setEstimate, setOrigin, setSelectedVehicle } from '@/store/slices/tripSlice';
import { getRouteEstimate } from '@/services/googleMapsService';
import { createTrip } from '@/services/tripService';
import { calculateEstimatedFare } from '@/utils/fare';
import { createNearbyDriverLocation } from '@/utils/driverSimulation';

const PICKUP_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835955.png';
const DESTINATION_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835977.png';

export function HomeScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const { userId } = useAppSelector(state => state.auth);
    const { origin, destination, estimate, selectedVehicle } = useAppSelector(state => state.trip);
    const { location, error, requestLocation } = useCurrentLocation();
    const [loading, setLoading] = useState(false);
    const [extraTip, setExtraTip] = useState(0);

    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

    useEffect(() => {
        requestLocation();
        // Forzamos la apertura del panel al cargar
        setTimeout(() => {
            bottomSheetRef.current?.snapToIndex(0);
        }, 1000);
    }, [requestLocation]);

    useEffect(() => {
        if (location && !origin) {
            dispatch(setOrigin(location));
        }
    }, [dispatch, location, origin]);

    const fare = useMemo(() => {
        if (!estimate) return 0;
        const calculated = calculateEstimatedFare(estimate.distanceKm, estimate.durationMinutes, selectedVehicle);
        return calculated + extraTip;
    }, [estimate, selectedVehicle, extraTip]);

    async function handleDestinationSelected(data, details) {
        if (!details) return;
        const loc = details.geometry.location;
        const newDest = { 
            latitude: loc.lat, 
            longitude: loc.lng, 
            address: data.description 
        };
        dispatch(setDestination(newDest));
        
        if (origin) {
            await updateRoute(origin, newDest);
        }
    }

    async function handleOriginSelected(data, details) {
        if (!details) return;
        const loc = details.geometry.location;
        const newOrigin = { 
            latitude: loc.lat, 
            longitude: loc.lng, 
            address: data.description 
        };
        dispatch(setOrigin(newOrigin));
        
        if (destination) {
            await updateRoute(newOrigin, destination);
        }
    }

    async function updateRoute(start, end) {
        setLoading(true);
        try {
            const nextEstimate = await getRouteEstimate(start, end);
            dispatch(setEstimate(nextEstimate));
            
            // Forzamos a que suba al punto medio (450px)
            bottomSheetRef.current?.snapToIndex(1);
        } catch (err) {
            console.error('Error calculando ruta:', err);
            Alert.alert('Lo sentimos', 'No pudimos obtener el precio.');
        } finally {
            setLoading(false);
        }
    }

    async function handleRequestRide() {
        console.log('Iniciando solicitud de viaje...');
        console.log('Estado actual:', { userId, hasOrigin: !!origin, hasDest: !!destination, hasEstimate: !!estimate });

        if (!userId) {
            Alert.alert('Error de sesión', 'No pudimos verificar tu usuario. Intenta cerrar sesión y volver a entrar.');
            return;
        }

        if (!origin || !destination || !estimate) {
            Alert.alert('Faltan datos', 'Por favor selecciona el punto de recogida y el destino en el mapa.');
            return;
        }

        try {
            setLoading(true);
            const tripData = {
                userId,
                origin,
                destination,
                distanceKm: estimate.distanceKm,
                durationMinutes: estimate.durationMinutes,
                vehicleCategory: selectedVehicle,
                estimatedFare: fare,
                tip: extraTip,
                status: 'requested',
                driverLocation: createNearbyDriverLocation(origin),
                paymentStatus: 'pending',
                currency: 'COP',
            };

            console.log('Enviando a Firebase:', tripData);
            const tripId = await createTrip(tripData);
            console.log('Viaje creado con ID:', tripId);
            
            navigation.navigate('TripTracking', { tripId });
        } catch (error) {
            console.error('Error al crear el viaje:', error);
            Alert.alert('Error', 'No pudimos crear tu viaje en este momento: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    }

    return (
      <Screen scroll={false}>
        <View style={styles.container}>
          <MapView 
            provider={PROVIDER_GOOGLE} 
            style={styles.map} 
            initialRegion={{
                latitude: origin?.latitude ?? 4.711,
                longitude: origin?.longitude ?? -74.0721,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }}
            region={origin ? {
                latitude: origin.latitude,
                longitude: origin.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            } : undefined}
            showsUserLocation
          >
            {origin && (
              <Marker coordinate={origin} title={t('whereToPick')}>
                <Image source={{ uri: PICKUP_ICON }} style={styles.markerIcon} />
              </Marker>
            )}
            {destination && (
              <Marker coordinate={destination} title={t('whereToGo')}>
                <Image source={{ uri: DESTINATION_ICON }} style={styles.markerIcon} />
              </Marker>
            )}
            {origin && destination && (
              <MapViewDirections 
                apikey={env.googleMapsApiKey} 
                destination={destination} 
                origin={origin} 
                strokeColor="#111827" 
                strokeWidth={5}
              />
            )}
          </MapView>

          <View style={styles.searchOverlay}>
            <View style={styles.inputCard}>
               <AddressInput 
                  label={t('whereToPick')}
                  placeholder={t('currentLocPlaceholder')}
                  value={origin?.address}
                  iconColor="#10b981"
                  onPress={handleOriginSelected}
               />
               <View style={styles.divider} />
               <AddressInput 
                  label={t('whereToGo')}
                  placeholder={t('writeDestPlaceholder')}
                  value={destination?.address}
                  iconColor="#ef4444"
                  onPress={handleDestinationSelected}
               />
            </View>
          </View>

          <View style={styles.bottomCardContainer}>
            <View style={styles.panelCard}>
              {estimate ? (
                <>
                  <Text style={styles.panelTitle}>{t('rideOptions')}</Text>
                  
                  <VehicleSelector 
                    value={selectedVehicle} 
                    onChange={category => dispatch(setSelectedVehicle(category))}
                  />

                  <View style={styles.incentiveContainer}>
                    <Text style={styles.incentiveTitle}>{t('incentiveTitle')}</Text>
                    <View style={styles.tipOptions}>
                      {[0, 2000, 5000, 10000].map((amount) => (
                        <TouchableOpacity 
                          key={amount} 
                          style={[styles.tipButton, extraTip === amount && styles.tipButtonActive]}
                          onPress={() => setExtraTip(amount)}
                        >
                          <Text style={[styles.tipText, extraTip === amount && styles.tipTextActive]}>
                            {amount === 0 ? t('offerNormal') : `+$${amount/1000}k`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <View style={styles.fareInfo}>
                      <View>
                        <Text style={styles.totalLabel}>{t('totalToPay')}</Text>
                        <Text style={styles.subText}>{estimate.distanceKm} km • {estimate.durationMinutes} min</Text>
                      </View>
                      <Text style={styles.totalValue}>${fare.toLocaleString('es-CO')}</Text>
                    </View>
                    <AppButton 
                      loading={loading} 
                      onPress={handleRequestRide} 
                      title={t('requestRideNow')}
                      style={styles.mainButton}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.waitingContainer}>
                   <Image 
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/8156/8156714.png' }} 
                      style={styles.waitingIcon} 
                   />
                   <Text style={styles.waitingText}>
                    {!destination 
                      ? t('waitingDestination') 
                      : t('calculatingFare')}
                   </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Screen>
    );
}

function AddressInput({ label, placeholder, value, iconColor, onPress }) {
    return (
        <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: iconColor }]} />
            <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{label}</Text>
                <GooglePlacesAutocomplete 
                    debounce={300} 
                    enablePoweredByContainer={false} 
                    fetchDetails 
                    placeholder={placeholder} 
                    onPress={onPress}
                    query={{ key: env.googleMapsApiKey, language: 'es', components: 'country:co' }} 
                    styles={{
                        textInput: styles.autocompleteInput,
                        container: { flex: 0 },
                        listView: styles.listView
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    searchOverlay: {
        position: 'absolute',
        top: 50,
        left: 15,
        right: 15,
        zIndex: 10,
    },
    inputCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 15,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
        marginBottom: -5,
        marginLeft: 5,
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 10,
        marginLeft: 25,
    },
    autocompleteInput: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        backgroundColor: 'transparent',
        height: 45,
    },
    listView: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginTop: 5,
    },
    bottomCardContainer: {
        position: 'absolute',
        bottom: 110, // Subimos la tarjeta para que el menú flotante no la tape
        left: 15,
        right: 15,
        zIndex: 10,
    },
    panelCard: {
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 20,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    panelTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 10,
        textAlign: 'center',
    },
    incentiveContainer: {
        backgroundColor: '#fefce8',
        borderRadius: 18,
        padding: 12,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: '#fef08a',
    },
    incentiveTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#854d0e',
        textAlign: 'center',
        marginBottom: 8,
    },
    tipOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 8,
    },
    tipButton: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    tipButtonActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    tipText: {
        fontWeight: '700',
        color: '#374151',
        fontSize: 12,
    },
    tipTextActive: {
        color: 'white',
    },
    footer: {
        marginTop: 10,
        gap: 12,
    },
    fareInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    totalLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 26,
        fontWeight: '900',
        color: '#111827',
    },
    subText: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },
    waitingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    waitingIcon: {
        width: 40,
        height: 40,
        marginBottom: 10,
        opacity: 0.6,
    },
    waitingText: {
        fontSize: 15,
        color: '#6b7280',
        fontWeight: '600',
        textAlign: 'center',
    },
    mainButton: {
        height: 55,
        borderRadius: 15,
    },
    markerIcon: {
        width: 45,
        height: 45,
        resizeMode: 'contain',
    },
});
