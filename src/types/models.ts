export type LanguageCode = 'es' | 'en';

export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';

export type VehicleCategory = 'economy' | 'xl' | 'premium';

export type TripStatus =
  | 'requested'
  | 'driver_assigned'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PlaceLocation = Coordinates & {
  address: string;
  placeId?: string;
};

export type UserProfile = {
  id: string;
  fullName: string;
  phoneNumber: string;
  gender: Gender;
  email: string;
  preferredLanguage: LanguageCode;
  photoUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Trip = {
  id: string;
  userId: string;
  origin: PlaceLocation;
  destination: PlaceLocation;
  distanceKm: number;
  durationMinutes: number;
  vehicleCategory: VehicleCategory;
  estimatedFare: number;
  finalFare?: number;
  status: TripStatus;
  driverLocation?: Coordinates;
  paymentStatus: PaymentStatus;
  paymentProvider?: 'stripe';
  currency: string;
  createdAt?: unknown;
  completedAt?: unknown;
};

export type RouteEstimate = {
  distanceKm: number;
  durationMinutes: number;
};
