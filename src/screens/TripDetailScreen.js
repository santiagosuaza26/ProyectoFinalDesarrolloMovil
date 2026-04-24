import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { createNearbyDriverLocation } from '@/utils/driverSimulation';
import { createTrip } from '@/services/tripService';
import { calculateEstimatedFare } from '@/utils/fare';

const PICKUP_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835955.png';
const DEST_ICON = 'https://cdn-icons-png.flaticon.com/512/5835/5835977.png';

export function TripDetailScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { trip } = route.params;
    const [loading, setLoading] = useState(false);
    const [showRebookOptions, setShowRebookOptions] = useState(false);

    const handleSupport = () => {
        Alert.alert(
            'Centro de Ayuda',
            '¿Cómo podemos ayudarte con este viaje?',
            [
                { text: 'Problema con el cobro', onPress: () => Alert.alert('Ticket Creado', 'Un asesor revisará el cobro de tu viaje.') },
                { text: 'Problema con el conductor', onPress: () => Alert.alert('Ticket Creado', 'Gracias por tu reporte. Investigaremos lo sucedido.') },
                { text: 'Cancelar', style: 'cancel' }
            ]
        );
    };

    const handleReportLostItem = () => {
        Alert.alert(
            'Reportar Objeto Perdido',
            'Enviaremos un mensaje al conductor para intentar recuperar tu objeto. ¿Deseas continuar?',
            [
                { text: 'Sí, reportar', onPress: () => Alert.alert('Reporte Enviado', 'El conductor ha sido notificado.') },
                { text: 'No', style: 'cancel' }
            ]
        );
    };

    const handleRebook = async (option) => {
        try {
            setLoading(true);
            let finalFare = trip.estimatedFare;
            let driverLocation = createNearbyDriverLocation(trip.origin);
            let status = 'requested';
            let extraInfo = {};

            if (option === 'same_driver') {
                // Calculate distance from driver back to pickup
                // We simulate a distance of ~2km for the driver to return
                const returnDistance = 2.5; 
                const totalKm = trip.distanceKm + returnDistance;
                finalFare = calculateEstimatedFare(totalKm, trip.durationMinutes + 5, trip.vehicleCategory);
                
                status = 'driver_assigned';
                extraInfo = {
                    driverName: trip.driverName,
                    vehiclePlate: trip.vehiclePlate,
                    vehicleModel: trip.vehicleModel,
                    driverRating: trip.driverRating,
                    rebooked: true
                };
                Alert.alert('Reasignando', `Solicitando a ${trip.driverName}. Nueva tarifa estimada: $${finalFare.toLocaleString('es-CO')}`);
            }

            const newTripId = await createTrip({
                ...trip,
                id: undefined, // Let Firebase generate a new ID
                status,
                estimatedFare: finalFare,
                createdAt: new Date(),
                paymentStatus: 'pending',
                driverLocation,
                ...extraInfo
            });

            navigation.navigate('TripTracking', { tripId: newTripId });
        } catch (error) {
            console.error('Rebook error:', error);
            Alert.alert('Error', 'No se pudo crear el nuevo viaje.');
        } finally {
            setLoading(false);
            setShowRebookOptions(false);
        }
    };

    return (
        <Screen style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.dateText}>
                        {trip.createdAt?.toDate ? trip.createdAt.toDate().toLocaleString() : 'Fecha no disponible'}
                    </Text>
                    <View style={[styles.statusBadge, trip.status === 'cancelled' && styles.statusCancelled]}>
                        <Text style={[styles.statusText, trip.status === 'cancelled' && styles.statusTextCancelled]}>
                            {t(trip.status)}
                        </Text>
                    </View>
                </View>

                <View style={styles.mapContainer}>
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={{
                            latitude: (trip.origin.latitude + trip.destination.latitude) / 2,
                            longitude: (trip.origin.longitude + trip.destination.longitude) / 2,
                            latitudeDelta: Math.abs(trip.origin.latitude - trip.destination.latitude) * 2,
                            longitudeDelta: Math.abs(trip.origin.longitude - trip.destination.longitude) * 2,
                        }}
                        scrollEnabled={false}
                    >
                        <Marker coordinate={trip.origin}><Image source={{ uri: PICKUP_ICON }} style={styles.markerIcon} /></Marker>
                        <Marker coordinate={trip.destination}><Image source={{ uri: DEST_ICON }} style={styles.markerIcon} /></Marker>
                    </MapView>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Resumen del trayecto</Text>
                    <View style={styles.routeRow}>
                        <View style={styles.routeDots}>
                            <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                            <View style={styles.line} />
                            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                        </View>
                        <View style={styles.addresses}>
                            <Text style={styles.addressText} numberOfLines={2}>{trip.origin.address}</Text>
                            <Text style={styles.addressText} numberOfLines={2}>{trip.destination.address}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Distancia</Text>
                            <Text style={styles.statValue}>{trip.distanceKm} km</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Duración</Text>
                            <Text style={styles.statValue}>{trip.durationMinutes} min</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total</Text>
                            <Text style={[styles.statValue, styles.priceValue]}>
                                ${ (trip.finalFare || trip.estimatedFare).toLocaleString('es-CO') }
                            </Text>
                        </View>
                    </View>
                </View>

                {trip.driverName && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Conductor</Text>
                        <View style={styles.driverInfo}>
                            <Image 
                                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
                                style={styles.driverPhoto} 
                            />
                            <View>
                                <Text style={styles.driverName}>{trip.driverName}</Text>
                                <Text style={styles.vehicleText}>{trip.vehiclePlate} • {trip.vehicleModel}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.actionsContainer}>
                    <View style={styles.secondaryActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleSupport}>
                            <Ionicons name="help-buoy-outline" size={24} color="#374151" />
                            <Text style={styles.actionText}>Soporte</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleReportLostItem}>
                            <Ionicons name="briefcase-outline" size={24} color="#374151" />
                            <Text style={styles.actionText}>Objeto Perdido</Text>
                        </TouchableOpacity>
                    </View>

                    {showRebookOptions ? (
                        <View style={styles.rebookOptions}>
                            <AppButton 
                                title="Mismo Conductor (Suma retorno)" 
                                onPress={() => handleRebook('same_driver')}
                                loading={loading}
                                style={styles.rebookBtn}
                            />
                            <AppButton 
                                title="Conductor más cercano" 
                                variant="secondary"
                                onPress={() => handleRebook('nearest')}
                                loading={loading}
                                style={styles.rebookBtn}
                            />
                            <TouchableOpacity onPress={() => setShowRebookOptions(false)} style={styles.cancelLink}>
                                <Text style={styles.cancelLinkText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <AppButton 
                            title="Volver a solicitar viaje" 
                            onPress={() => setShowRebookOptions(true)}
                        />
                    )}
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    scroll: { paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    dateText: { fontSize: 16, fontWeight: '700', color: '#374151' },
    statusBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusCancelled: { backgroundColor: '#fee2e2' },
    statusText: { color: '#166534', fontWeight: '800', textTransform: 'uppercase', fontSize: 12 },
    statusTextCancelled: { color: '#991b1b' },
    mapContainer: { height: 200, marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', elevation: 5 },
    map: { ...StyleSheet.absoluteFillObject },
    card: { backgroundColor: 'white', margin: 20, marginTop: 10, padding: 20, borderRadius: 24, elevation: 3 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
    routeRow: { flexDirection: 'row', gap: 15 },
    routeDots: { alignItems: 'center', paddingVertical: 5 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    line: { width: 2, flex: 1, backgroundColor: '#f3f4f6', marginVertical: 5 },
    addresses: { flex: 1, gap: 20 },
    addressText: { fontSize: 15, fontWeight: '600', color: '#111827' },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    statItem: { alignItems: 'center' },
    statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 5 },
    statValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
    priceValue: { color: '#111827', fontSize: 18 },
    driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    driverPhoto: { width: 50, height: 50, borderRadius: 25 },
    driverName: { fontSize: 18, fontWeight: '900', color: '#111827' },
    vehicleText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    actionsContainer: { paddingHorizontal: 20, gap: 15 },
    secondaryActions: { flexDirection: 'row', gap: 15 },
    actionButton: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 20, alignItems: 'center', gap: 8, elevation: 2 },
    actionText: { fontSize: 12, fontWeight: '700', color: '#374151' },
    rebookOptions: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 24, gap: 10 },
    rebookBtn: { height: 50 },
    cancelLink: { alignItems: 'center', marginTop: 5 },
    cancelLinkText: { color: '#6b7280', fontWeight: '700' },
    markerIcon: { width: 35, height: 35, resizeMode: 'contain' },
});
