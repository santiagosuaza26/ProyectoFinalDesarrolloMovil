const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

require('dotenv').config();

const port = process.env.PORT || 4242;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(stripeSecretKey);
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({status: 'ok'});
});

app.post('/create-payment-intent', async (request, response) => {
  const {amount, currency = 'usd'} = request.body;

  if (!Number.isInteger(amount) || amount <= 0) {
    response.status(400).json({error: 'A positive integer amount is required'});
    return;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {enabled: true},
    });

    response.json({clientSecret: paymentIntent.client_secret});
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Payment intent failed',
    });
  }
});

app.listen(port, () => {
  console.log(`Stripe demo server listening on port ${port}`);
});
