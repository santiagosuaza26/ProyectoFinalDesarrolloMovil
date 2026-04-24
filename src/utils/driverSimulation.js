export function createNearbyDriverLocation(origin) {
    return {
        latitude: origin.latitude + 0.012,
        longitude: origin.longitude - 0.012,
    };
}
export function moveTowardsTarget(current, target, progress = 0.25) {
    return {
        latitude: current.latitude + (target.latitude - current.latitude) * progress,
        longitude: current.longitude + (target.longitude - current.longitude) * progress,
    };
}
