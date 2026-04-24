/* eslint-env jest */

jest.mock('@react-native-firebase/auth', () => () => ({}));
jest.mock('@react-native-firebase/firestore', () => () => ({}));
jest.mock('@react-native-firebase/storage', () => () => ({}));
jest.mock('react-native-config', () => ({
  GOOGLE_MAPS_API_KEY: 'test-google-key',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_example',
  STRIPE_API_BASE_URL: 'http://localhost:4242',
}));
