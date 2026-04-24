import { validateEmail, validatePhoneNumber, validateProfileForm, } from '@/utils/validation';
describe('profile validation', () => {
    it('rejects empty required fields', () => {
        const result = validateProfileForm({
            fullName: '',
            phoneNumber: '',
            gender: '',
            email: '',
            preferredLanguage: 'es',
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.fullName).toBeDefined();
        expect(result.errors.phoneNumber).toBeDefined();
        expect(result.errors.gender).toBeDefined();
        expect(result.errors.email).toBeDefined();
    });
    it('rejects names longer than 50 characters', () => {
        const result = validateProfileForm({
            fullName: 'A'.repeat(51),
            phoneNumber: '3001234567',
            gender: 'prefer_not_to_say',
            email: 'user@example.com',
            preferredLanguage: 'en',
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.fullName).toBeDefined();
    });
    it('validates email and phone formats', () => {
        expect(validateEmail('student@example.com')).toBe(true);
        expect(validateEmail('student@example')).toBe(false);
        expect(validatePhoneNumber('3001234567')).toBe(true);
        expect(validatePhoneNumber('300-123')).toBe(false);
    });
});
