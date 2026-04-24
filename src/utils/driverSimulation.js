export function createNearbyDriverLocation(origin) {
    return {
        latitude: origin.latitude + 0.012,
        longitude: origin.longitude - 0.012,
    };
}
export function moveTowardsTarget(current, target, speed = 0.0005) {
    const dLat = target.latitude - current.latitude;
    const dLng = target.longitude - current.longitude;
    const distance = Math.sqrt(dLat * dLat + dLng * dLng);

    if (distance < speed) {
        return target;
    }

    return {
        latitude: current.latitude + (dLat / distance) * speed,
        longitude: current.longitude + (dLng / distance) * speed,
    };
}
