import {useCallback, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import type {PlaceLocation} from '@/types/models';

export function useCurrentLocation() {
  const [location, setLocation] = useState<PlaceLocation>();
  const [error, setError] = useState<string>();

  const requestLocation = useCallback(async () => {
    setError(undefined);

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setError('permission-denied');
        return undefined;
      }
    }

    return new Promise<PlaceLocation | undefined>(resolve => {
      Geolocation.getCurrentPosition(
        position => {
          const nextLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: 'Current location',
          };
          setLocation(nextLocation);
          resolve(nextLocation);
        },
        () => {
          setError('location-unavailable');
          resolve(undefined);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    });
  }, []);

  return {location, error, requestLocation};
}
