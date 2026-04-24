import firestore from '@react-native-firebase/firestore';
import type {
  Coordinates,
  PaymentStatus,
  Trip,
  TripStatus,
} from '@/types/models';

const trips = () => firestore().collection('trips');

export async function createTrip(payload: Omit<Trip, 'id' | 'createdAt'>) {
  const reference = await trips().add({
    ...payload,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return reference.id;
}

export function listenToTrip(tripId: string, callback: (trip?: Trip) => void) {
  return trips()
    .doc(tripId)
    .onSnapshot(snapshot => {
      callback(
        snapshot.exists
          ? ({id: snapshot.id, ...snapshot.data()} as Trip)
          : undefined,
      );
    });
}

export function listenToUserTrips(
  userId: string,
  callback: (userTrips: Trip[]) => void,
) {
  return trips()
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      callback(
        snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Trip)),
      );
    });
}

export async function updateTripStatus(
  tripId: string,
  status: TripStatus,
  extra: Partial<Trip> = {},
) {
  await trips()
    .doc(tripId)
    .update({
      status,
      ...extra,
      ...(status === 'completed'
        ? {completedAt: firestore.FieldValue.serverTimestamp()}
        : {}),
    });
}

export async function updateDriverLocation(
  tripId: string,
  driverLocation: Coordinates,
) {
  await trips().doc(tripId).update({driverLocation});
}

export async function updateTripPayment(
  tripId: string,
  paymentStatus: PaymentStatus,
  finalFare: number,
) {
  await trips().doc(tripId).update({
    paymentStatus,
    finalFare,
    paymentProvider: 'stripe',
    paidAt:
      paymentStatus === 'paid' ? firestore.FieldValue.serverTimestamp() : null,
  });
}
