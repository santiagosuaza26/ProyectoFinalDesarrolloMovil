import { createNearbyDriverLocation, moveTowardsTarget } from '@/utils/driverSimulation';
describe('driver simulation', () => {
    it('creates a nearby driver location', () => {
        const origin = { latitude: 4.711, longitude: -74.0721 };
        const driver = createNearbyDriverLocation(origin);
        expect(driver.latitude).not.toBe(origin.latitude);
        expect(driver.longitude).not.toBe(origin.longitude);
    });
    it('moves towards target coordinates', () => {
        // Para llegar a (5,5) desde (0,0) hacia (10,10), la distancia es sqrt(5^2 + 5^2) = sqrt(50) ≈ 7.071
        const speed = Math.sqrt(50);
        const next = moveTowardsTarget({ latitude: 0, longitude: 0 }, { latitude: 10, longitude: 10 }, speed);
        expect(next.latitude).toBeCloseTo(5);
        expect(next.longitude).toBeCloseTo(5);
    });
});
