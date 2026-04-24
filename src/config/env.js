import Config from 'react-native-config';
export const env = {
    googleMapsApiKey: Config.GOOGLE_MAPS_API_KEY ?? '',
    stripePublishableKey: Config.STRIPE_PUBLISHABLE_KEY ?? '',
    stripeApiBaseUrl: Config.STRIPE_API_BASE_URL ?? 'http://10.0.2.2:4242',
};
