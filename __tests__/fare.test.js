import { calculateEstimatedFare } from '@/utils/fare';
describe('fare calculation', () => {
    it('increases price by vehicle category', () => {
        const economy = calculateEstimatedFare(10, 20, 'economy');
        const xl = calculateEstimatedFare(10, 20, 'xl');
        const premium = calculateEstimatedFare(10, 20, 'premium');
        expect(economy).toBeGreaterThan(0);
        expect(xl).toBeGreaterThan(economy);
        expect(premium).toBeGreaterThan(xl);
    });
});
