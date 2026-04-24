const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d+$/;
export function validateEmail(email) {
    return emailPattern.test(email.trim());
}
export function validatePhoneNumber(phoneNumber) {
    return phonePattern.test(phoneNumber.trim());
}
export function validateProfileForm(form) {
    const errors = {};
    if (!form.fullName.trim()) {
        errors.fullName = 'Full name is required';
    }
    else if (form.fullName.trim().length > 50) {
        errors.fullName = 'Full name must be 50 characters or less';
    }
    if (!form.phoneNumber.trim()) {
        errors.phoneNumber = 'Phone number is required';
    }
    else if (!validatePhoneNumber(form.phoneNumber)) {
        errors.phoneNumber = 'Phone number must contain only numbers';
    }
    if (!form.gender) {
        errors.gender = 'Gender is required';
    }
    if (!form.email.trim()) {
        errors.email = 'Email is required';
    }
    else if (!validateEmail(form.email)) {
        errors.email = 'Email must include @ and a valid domain';
    }
    if (!form.preferredLanguage) {
        errors.preferredLanguage = 'Language is required';
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
export function validateRegistrationForm(form) {
    const profileErrors = validateProfileForm(form);
    const errors = profileErrors.errors;
    if (!form.photoUrl) {
        errors.photoUrl = 'Photo is required';
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
