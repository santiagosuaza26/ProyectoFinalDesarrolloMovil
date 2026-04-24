import axios from 'axios';
import {env} from '@/config/env';
import type {PlaceLocation, RouteEstimate} from '@/types/models';

type DistanceMatrixResponse = {
  rows: Array<{
    elements: Array<{
      status: string;
      distance?: {value: number};
      duration?: {value: number};
    }>;
  }>;
};

export async function getRouteEstimate(
  origin: PlaceLocation,
  destination: PlaceLocation,
): Promise<RouteEstimate> {
  const response = await axios.get<DistanceMatrixResponse>(
    'https://maps.googleapis.com/maps/api/distancematrix/json',
    {
      params: {
        origins: `${origin.latitude},${origin.longitude}`,
        destinations: `${destination.latitude},${destination.longitude}`,
        key: env.googleMapsApiKey,
      },
    },
  );

  const element = response.data.rows[0]?.elements[0];
  if (!element || element.status !== 'OK') {
    throw new Error('Unable to calculate route estimate');
  }

  return {
    distanceKm: Number(((element.distance?.value ?? 0) / 1000).toFixed(2)),
    durationMinutes: Math.ceil((element.duration?.value ?? 0) / 60),
  };
}
