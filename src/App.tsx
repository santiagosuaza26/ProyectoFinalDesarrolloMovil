import React from 'react';
import {Provider} from 'react-redux';
import {StripeProvider} from '@stripe/stripe-react-native';
import './i18n';
import {RootNavigator} from '@/navigation/RootNavigator';
import {store} from '@/store';
import {env} from '@/config/env';

export default function App() {
  return (
    <Provider store={store}>
      <StripeProvider publishableKey={env.stripePublishableKey}>
        <RootNavigator />
      </StripeProvider>
    </Provider>
  );
}
