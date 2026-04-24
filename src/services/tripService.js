import firestore from '@react-native-firebase/firestore';
const trips = () => firestore().collection('trips');
export async function createTrip(payload) {
    const reference = await trips().add({
        ...payload,
        createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return reference.id;
}
export function listenToTrip(tripId, callback) {
    return trips()
        .doc(tripId)
        .onSnapshot(snapshot => {
        callback(snapshot.exists
            ? { id: snapshot.id, ...snapshot.data() }
            : undefined);
    });
}
export function listenToUserTrips(userId, callback) {
    return trips()
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
}
export async function updateTripStatus(tripId, status, extra = {}) {
    await trips()
        .doc(tripId)
        .update({
        status,
        ...extra,
        ...(status === 'completed'
            ? { completedAt: firestore.FieldValue.serverTimestamp() }
            : {}),
    });
}
export async function updateDriverLocation(tripId, driverLocation) {
    await trips().doc(tripId).update({ driverLocation });
}
export async function updateTripPayment(tripId, paymentStatus, finalFare) {
    await trips().doc(tripId).update({
        paymentStatus,
        finalFare,
        paymentProvider: 'stripe',
        paidAt: paymentStatus === 'paid' ? firestore.FieldValue.serverTimestamp() : null,
    });
}
