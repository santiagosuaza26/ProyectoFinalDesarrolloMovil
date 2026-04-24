import axios from 'axios';
import {env} from '@/config/env';

type PaymentIntentResponse = {
  clientSecret: string;
};

export async function createPaymentIntent(amount: number, currency = 'usd') {
  const response = await axios.post<PaymentIntentResponse>(
    `${env.stripeApiBaseUrl}/create-payment-intent`,
    {
      amount: Math.round(amount * 100),
      currency,
    },
  );

  return response.data.clientSecret;
}
