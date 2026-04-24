import type {Coordinates} from '@/types/models';

export function createNearbyDriverLocation(origin: Coordinates): Coordinates {
  return {
    latitude: origin.latitude + 0.012,
    longitude: origin.longitude - 0.012,
  };
}

export function moveTowardsTarget(
  current: Coordinates,
  target: Coordinates,
  progress = 0.25,
): Coordinates {
  return {
    latitude: current.latitude + (target.latitude - current.latitude) * progress,
    longitude:
      current.longitude + (target.longitude - current.longitude) * progress,
  };
}
