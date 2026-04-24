import axios from 'axios';
import { env } from '@/config/env';
export async function createPaymentIntent(amount, currency = 'usd') {
    const response = await axios.post(`${env.stripeApiBaseUrl}/create-payment-intent`, {
        amount: Math.round(amount * 100),
        currency,
    });
    return response.data.clientSecret;
}
