import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Alert, StyleSheet, Text, View, Image, ScrollView, TouchableOpacity } from 'react-native';
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
const SEARCHING_LOTTIE = 'https://assets9.lottiefiles.com/packages/lf20_7zS7vS.json';

export function TripTrackingScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [trip, setTrip] = useState();
    const [loading, setLoading] = useState(false);
    const [offers, setOffers] = useState([]);
    const mapRef = useRef(null);

    // Bottom Sheet setup (ahora lo usamos para la lista de ofertas si es necesario, 
    // pero mantendremos la tarjeta fija para consistencia)
    const snapPoints = useMemo(() => ['35%', '60%'], []);

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

    // Escuchar el viaje y simular ofertas
    useEffect(() => {
        return listenToTrip(route.params.tripId, (updatedTrip) => {
            setTrip(updatedTrip);
            
            // Si el viaje está solicitado, simulamos que llegan ofertas después de unos segundos
            if (updatedTrip?.status === 'requested' && offers.length === 0) {
                setTimeout(() => {
                    const simulatedOffers = [
                        { 
                            id: 'off-1', 
                            driverName: 'Carlos Mario', 
                            rating: '4.9', 
                            trips: '2,450', 
                            price: updatedTrip.estimatedFare, 
                            vehicle: 'Kia Picanto • Blanco',
                            plate: 'ABC-123',
                            photo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                        },
                        { 
                            id: 'off-2', 
                            driverName: 'Andrés Felipe', 
                            rating: '4.8', 
                            trips: '1,120', 
                            price: updatedTrip.estimatedFare + 2000, 
                            vehicle: 'Renault Logan • Gris',
                            plate: 'XYZ-789',
                            photo: 'https://cdn-icons-png.flaticon.com/512/4128/4128176.png'
                        },
                        { 
                            id: 'off-3', 
                            driverName: 'Sandra Milena', 
                            rating: '5.0', 
                            trips: '540', 
                            price: updatedTrip.estimatedFare + 5000, 
                            vehicle: 'Chevrolet Onix • Rojo',
                            plate: 'MNO-456',
                            photo: 'https://cdn-icons-png.flaticon.com/512/6997/6997662.png'
                        }
                    ];
                    setOffers(simulatedOffers);
                }, 3000); // 3 segundos de "buscando"
            }

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
    }, [route.params.tripId, carLat, carLng, offers.length]);

    // Detener el simulador automático de status para que no pase a driver_assigned solo
    useEffect(() => {
        if (!trip || trip.status === 'completed' || trip.status === 'cancelled' || trip.status === 'requested') {
            return undefined;
        }
        const timer = setInterval(async () => {
            const currentDriverLocation = trip.driverLocation ?? trip.origin;
            const nextDriverLocation = moveTowardsTarget(currentDriverLocation, trip.origin);
            await updateDriverLocation(trip.id, nextDriverLocation);
            
            if (trip.status === 'driver_assigned') {
                await updateTripStatus(trip.id, 'arriving');
            }
        }, 5000);
        return () => clearInterval(timer);
    }, [trip]);

    async function handleAcceptOffer(offer) {
        try {
            setLoading(true);
            await updateTripStatus(trip.id, 'driver_assigned', {
                driverName: offer.driverName,
                vehiclePlate: offer.plate,
                vehicleModel: offer.vehicle,
                finalFare: offer.price,
                driverRating: offer.rating
            });
            // También movemos al conductor a una posición inicial cercana
            await updateDriverLocation(trip.id, {
                latitude: trip.origin.latitude + 0.005,
                longitude: trip.origin.longitude - 0.005
            });
            setOffers([]); // Limpiamos ofertas
        } catch (error) {
            Alert.alert('Error', 'No pudimos aceptar la oferta.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (trip?.driverLocation && mapRef.current) {
            mapRef.current.fitToCoordinates([trip.origin, trip.driverLocation], {
                edgePadding: { top: 100, right: 100, bottom: 300, left: 100 },
                animated: true,
            });
        }
    }, [trip?.driverLocation, trip?.origin]);

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

    const isRequested = trip.status === 'requested';
    const isCompleted = trip.status === 'completed';

    return (<Screen scroll={false}>
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

        <View style={styles.bottomCardContainer}>
          <View style={styles.panelCard}>
            {isRequested ? (
              offers.length === 0 ? (
                <SearchingDriver />
              ) : (
                <View style={styles.offersContainer}>
                  <Text style={styles.offersTitle}>Conductores interesados</Text>
                  <ScrollView style={styles.offersList} showsVerticalScrollIndicator={false}>
                    {offers.map((offer) => (
                      <TouchableOpacity 
                        key={offer.id} 
                        style={styles.offerItem}
                        onPress={() => handleAcceptOffer(offer)}
                      >
                        <Image source={{ uri: offer.photo }} style={styles.offerDriverPhoto} />
                        <View style={styles.offerInfo}>
                          <Text style={styles.offerDriverName}>{offer.driverName}</Text>
                          <Text style={styles.offerVehicle}>{offer.vehicle}</Text>
                          <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color="#fbbf24" />
                            <Text style={styles.offerRating}>{offer.rating}</Text>
                          </View>
                        </View>
                        <View style={styles.offerPriceContainer}>
                          <Text style={styles.offerPrice}>${offer.price.toLocaleString('es-CO')}</Text>
                          <View style={styles.acceptBadge}>
                            <Text style={styles.acceptText}>Aceptar</Text>
                          </View>
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
                    <Text style={styles.driverName}>{trip.driverName || 'Carlos Mario'}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={16} color="#fbbf24" />
                      <Text style={styles.ratingText}>{trip.driverRating || '4.9'} (2,450 {t('history')})</Text>
                    </View>
                  </View>
                  <View style={styles.driverPhotoContainer}>
                    <Image 
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
                      style={styles.driverPhoto}
                    />
                  </View>
                </View>

                <View style={styles.vehicleRow}>
                   <View style={styles.vehicleInfo}>
                      <Text style={styles.vehiclePlate}>{trip.vehiclePlate || 'ABC-123'}</Text>
                      <Text style={styles.vehicleModel}>{trip.vehicleModel || 'Kia Picanto • Blanco'}</Text>
                   </View>
                   <View style={styles.chatButton}>
                      <Ionicons name="chatbubble-ellipses" size={24} color="#ffffff" />
                   </View>
                </View>

                <View style={styles.fareSummary}>
                  <Text style={styles.fareLabel}>{t('totalToPay')}</Text>
                  <Text style={styles.fareAmount}>${(trip.finalFare || trip.estimatedFare).toLocaleString('es-CO')}</Text>
                </View>
              </View>
            )}

            <View style={styles.actions}>
              {!isCompleted ? (
                <>
                   {trip.status === 'arriving' && (
                     <AppButton onPress={handleCompleteRide} title={t('completeRide')}/>
                   )}
                   <AppButton
                    onPress={() => updateTripStatus(trip.id, 'cancelled')}
                    title={t('cancelRide')}
                    variant="danger"
                  />
                </>
              ) : (
                <AppButton
                  disabled={trip.paymentStatus === 'paid'}
                  loading={loading}
                  onPress={handlePay}
                  title={t('payWithStripe')}
                />
              )}
            </View>
          </View>
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
    bottomCardContainer: {
        position: 'absolute',
        bottom: 110, // Arriba del menú flotante
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
    driverCard: {
        gap: 15,
    },
    offersContainer: {
        maxHeight: 400,
    },
    offersTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 15,
        textAlign: 'center',
    },
    offersList: {
        marginBottom: 10,
    },
    offerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 18,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    offerDriverPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e5e7eb',
    },
    offerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    offerDriverName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
    },
    offerVehicle: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    offerRating: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
        marginLeft: 3,
    },
    offerPriceContainer: {
        alignItems: 'flex-end',
        gap: 5,
    },
    offerPrice: {
        fontSize: 16,
        fontWeight: '900',
        color: '#111827',
    },
    acceptBadge: {
        backgroundColor: '#111827',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    acceptText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    driverHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driverInfo: {
        flex: 1,
    },
    statusBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#111827',
        textTransform: 'uppercase',
    },
    driverName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111827',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    ratingText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
    },
    driverPhotoContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f3f4f6',
        padding: 3,
    },
    driverPhoto: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9fafb',
        padding: 15,
        borderRadius: 15,
    },
    vehiclePlate: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    vehicleModel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    chatButton: {
        width: 45,
        height: 45,
        backgroundColor: '#111827',
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fareSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 15,
    },
    fareLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    fareAmount: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
    },
    actions: {
        marginTop: 20,
        gap: 12,
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
