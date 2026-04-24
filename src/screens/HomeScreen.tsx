import React, {useEffect, useMemo, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {AppButton} from '@/components/AppButton';
import {Screen} from '@/components/Screen';
import {VehicleSelector} from '@/components/VehicleSelector';
import {env} from '@/config/env';
import {useCurrentLocation} from '@/hooks/useCurrentLocation';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  setDestination,
  setEstimate,
  setOrigin,
  setSelectedVehicle,
} from '@/store/slices/tripSlice';
import {getRouteEstimate} from '@/services/googleMapsService';
import {createTrip} from '@/services/tripService';
import {calculateEstimatedFare} from '@/utils/fare';
import {createNearbyDriverLocation} from '@/utils/driverSimulation';
import type {PlaceLocation} from '@/types/models';
import type {RootStackParamList} from '@/types/navigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const {userId} = useAppSelector(state => state.auth);
  const {origin, destination, estimate, selectedVehicle} = useAppSelector(
    state => state.trip,
  );
  const {location, error, requestLocation} = useCurrentLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (location) {
      dispatch(setOrigin(location));
    }
  }, [dispatch, location]);

  useEffect(() => {
    if (error === 'permission-denied') {
      Alert.alert(t('permissionDenied'));
    }
  }, [error, t]);

  const fare = useMemo(() => {
    if (!estimate) {
      return 0;
    }
    return calculateEstimatedFare(
      estimate.distanceKm,
      estimate.durationMinutes,
      selectedVehicle,
    );
  }, [estimate, selectedVehicle]);

  async function handleDestinationSelected(nextDestination: PlaceLocation) {
    dispatch(setDestination(nextDestination));
    if (!origin) {
      return;
    }
    try {
      const nextEstimate = await getRouteEstimate(origin, nextDestination);
      dispatch(setEstimate(nextEstimate));
    } catch (requestError) {
      Alert.alert(
        'Error',
        requestError instanceof Error
          ? requestError.message
          : 'Unable to calculate route',
      );
    }
  }

  async function handleRequestRide() {
    if (!userId || !origin || !destination || !estimate) {
      Alert.alert(t('requiredFields'));
      return;
    }

    try {
      setLoading(true);
      const tripId = await createTrip({
        userId,
        origin,
        destination,
        distanceKm: estimate.distanceKm,
        durationMinutes: estimate.durationMinutes,
        vehicleCategory: selectedVehicle,
        estimatedFare: fare,
        status: 'requested',
        driverLocation: createNearbyDriverLocation(origin),
        paymentStatus: 'pending',
        currency: 'usd',
      });
      navigation.navigate('TripTracking', {tripId});
    } finally {
      setLoading(false);
    }
  }

  const initialRegion = {
    latitude: origin?.latitude ?? 4.711,
    longitude: origin?.longitude ?? -74.0721,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          region={origin ? {...initialRegion, ...origin} : initialRegion}
          showsUserLocation>
          {origin ? <Marker coordinate={origin} title={t('currentLocation')} /> : null}
          {destination ? (
            <Marker coordinate={destination} title={destination.address} />
          ) : null}
          {origin && destination ? (
            <MapViewDirections
              apikey={env.googleMapsApiKey}
              destination={destination}
              origin={origin}
              strokeColor="#2563eb"
              strokeWidth={4}
            />
          ) : null}
        </MapView>

        <View style={styles.panel}>
          <GooglePlacesAutocomplete
            debounce={300}
            enablePoweredByContainer={false}
            fetchDetails
            placeholder={t('destinationPlaceholder')}
            onPress={(data, details) => {
              const locationDetails = details?.geometry.location;
              if (!locationDetails) {
                return;
              }
              handleDestinationSelected({
                latitude: locationDetails.lat,
                longitude: locationDetails.lng,
                address: data.description,
                placeId: data.place_id,
              });
            }}
            query={{
              key: env.googleMapsApiKey,
              language: 'en',
            }}
            styles={{
              textInput: styles.autocompleteInput,
              listView: styles.autocompleteList,
            }}
          />

          <VehicleSelector
            value={selectedVehicle}
            onChange={category => dispatch(setSelectedVehicle(category))}
          />

          {estimate ? (
            <View style={styles.estimate}>
              <Text style={styles.estimateText}>
                {t('distance')}: {estimate.distanceKm} km
              </Text>
              <Text style={styles.estimateText}>
                {t('duration')}: {estimate.durationMinutes} min
              </Text>
              <Text style={styles.fare}>
                {t('estimatedFare')}: ${fare.toFixed(2)}
              </Text>
            </View>
          ) : null}

          <AppButton
            disabled={!destination || !estimate}
            loading={loading}
            onPress={handleRequestRide}
            title={t('requestRide')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  autocompleteInput: {
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    minHeight: 48,
  },
  autocompleteList: {
    borderRadius: 8,
  },
  container: {
    flex: 1,
  },
  estimate: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 4,
    padding: 12,
  },
  estimateText: {
    color: '#374151',
    fontWeight: '600',
  },
  fare: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
  },
  map: {
    flex: 1,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    gap: 14,
    padding: 14,
  },
});
