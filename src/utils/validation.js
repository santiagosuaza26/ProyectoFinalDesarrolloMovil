const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d+$/;

/**
 * Validates a user email address.
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
    return emailPattern.test(email?.trim() || '');
}

/**
 * Validates a strictly numeric phone number.
 * @param {string} phoneNumber
 * @returns {boolean}
 */
export function validatePhoneNumber(phoneNumber) {
    return phonePattern.test(phoneNumber?.trim() || '');
}

/**
 * Validates the profile form against rubric requirements.
 * Enforces:
 * - Max 50 characters for Full Name.
 * - Strictly numeric Phone Number.
 * - Non-empty Gender, Email, and Language.
 */
export function validateProfileForm(form) {
    const errors = {};

    const fullName = form.fullName?.trim() || '';
    if (!fullName) {
        errors.fullName = 'Full name is required';
    } else if (fullName.length > 50) {
        errors.fullName = 'Full name must be 50 characters or less';
    }

    const phoneNumber = form.phoneNumber?.trim() || '';
    if (!phoneNumber) {
        errors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(phoneNumber)) {
        errors.phoneNumber = 'Phone number must contain only numeric characters';
    }

    if (!form.gender) {
        errors.gender = 'Gender is required';
    }

    const email = form.email?.trim() || '';
    if (!email) {
        errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
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

/**
 * Validates the registration form including photo requirement.
 */
export function validateRegistrationForm(form) {
    const profileValidation = validateProfileForm(form);
    const errors = profileValidation.errors;

    if (!form.photoUrl) {
        errors.photoUrl = 'Profile photo is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
