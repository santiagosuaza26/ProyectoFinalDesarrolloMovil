import firestore from '@react-native-firebase/firestore';

const trips = () => firestore().collection('trips');

export async function createTrip(payload) {
    try {
        const reference = await trips().add({
            ...payload,
            createdAt: firestore.FieldValue.serverTimestamp(),
        });
        return reference.id;
    } catch (error) {
        console.error('Error in createTrip:', error);
        throw error;
    }
}

export function listenToTrip(tripId, callback) {
  if (!tripId) return () => {};
  
  return trips()
    .doc(tripId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot || !snapshot.exists) {
            callback(undefined);
            return;
        }
        callback({ id: snapshot.id, ...snapshot.data() });
      },
      (error) => {
        console.error('Error listening to trip:', error);
      }
    );
}

export function listenToUserTrips(userId, callback) {
  if (!userId) {
      callback([]);
      return () => {};
  }

  return trips()
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) {
          callback([]);
          return;
        }
        callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error('Error listening to user trips:', error);
        callback([]);
      }
    );
}

export async function updateTripStatus(tripId, status, extra = {}) {
    if (!tripId) throw new Error('Trip ID is required');
    
    try {
        const updateData = {
            status,
            ...extra,
        };

        if (status === 'completed') {
            updateData.completedAt = firestore.FieldValue.serverTimestamp();
        }

        await trips().doc(tripId).update(updateData);
    } catch (error) {
        console.error(`Error updating trip status to ${status}:`, error);
        throw error;
    }
}

export async function updateDriverLocation(tripId, driverLocation) {
    if (!tripId) return;
    try {
        await trips().doc(tripId).update({ driverLocation });
    } catch (error) {
        console.error('Error updating driver location:', error);
    }
}

export async function updateTripPayment(tripId, paymentStatus, finalFare) {
    if (!tripId) return;
    try {
        await trips().doc(tripId).update({
            paymentStatus,
            finalFare,
            paymentProvider: 'stripe',
            paidAt: paymentStatus === 'paid' ? firestore.FieldValue.serverTimestamp() : null,
        });
    } catch (error) {
        console.error('Error updating payment:', error);
    }
}
