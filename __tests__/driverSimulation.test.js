import { createNearbyDriverLocation, moveTowardsTarget, } from '@/utils/driverSimulation';
describe('driver simulation', () => {
    it('creates a nearby driver location', () => {
        const origin = { latitude: 4.711, longitude: -74.0721 };
        const driver = createNearbyDriverLocation(origin);
        expect(driver.latitude).not.toBe(origin.latitude);
        expect(driver.longitude).not.toBe(origin.longitude);
    });
    it('moves towards target coordinates', () => {
        const next = moveTowardsTarget({ latitude: 0, longitude: 0 }, { latitude: 10, longitude: 10 }, 0.5);
        expect(next).toEqual({ latitude: 5, longitude: 5 });
    });
});
