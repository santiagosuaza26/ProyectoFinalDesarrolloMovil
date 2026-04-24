const fareConfig = {
    economy: { baseFare: 2.5, perKm: 0.9, perMinute: 0.18, multiplier: 1 },
    xl: { baseFare: 4, perKm: 1.25, perMinute: 0.24, multiplier: 1.35 },
    premium: { baseFare: 6, perKm: 1.8, perMinute: 0.35, multiplier: 1.8 },
};
export function calculateEstimatedFare(distanceKm, durationMinutes, vehicleCategory) {
    const config = fareConfig[vehicleCategory];
    const rawFare = (config.baseFare +
        distanceKm * config.perKm +
        durationMinutes * config.perMinute) *
        config.multiplier;
    return Number(rawFare.toFixed(2));
}
