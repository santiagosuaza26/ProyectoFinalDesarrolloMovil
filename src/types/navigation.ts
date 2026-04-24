import type {NavigatorScreenParams} from '@react-navigation/native';
import type {Trip} from './models';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<AppTabParamList>;
  TripTracking: {tripId: string};
  TripDetail: {trip: Trip};
};
