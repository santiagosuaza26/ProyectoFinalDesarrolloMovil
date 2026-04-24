const RATE_PER_KM = 2000;
const MINIMUM_FARE = 5000;

const VEHICLE_MULTIPLIERS = {
    economy: 1,
    xl: 1.5,
    premium: 2,
};

export function calculateEstimatedFare(distanceKm, durationMinutes, vehicleCategory = 'economy') {
    const multiplier = VEHICLE_MULTIPLIERS[vehicleCategory] || 1;
    const baseFare = distanceKm * RATE_PER_KM * multiplier;
    
    return Math.max(Math.round(baseFare / 100) * 100, MINIMUM_FARE);
}
