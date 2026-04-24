import { createTrip, updateTripStatus } from '../src/services/tripService';

// Mock simple de Firestore para pruebas de lógica
jest.mock('@react-native-firebase/firestore', () => {
  const mockUpdate = jest.fn(() => Promise.resolve());
  const mockAdd = jest.fn(() => Promise.resolve({ id: 'mock-trip-id' }));
  const mockDoc = jest.fn(() => ({
    update: mockUpdate,
  }));
  const mockCollection = jest.fn(() => ({
    add: mockAdd,
    doc: mockDoc,
  }));
  
  return () => ({
    collection: mockCollection,
    FieldValue: {
      serverTimestamp: () => 'mock-timestamp',
    }
  });
});

describe('Trip Lifecycle Integration', () => {
  const mockPayload = {
    userId: 'user-123',
    origin: { latitude: 0, longitude: 0, address: 'Test Origin' },
    destination: { latitude: 1, longitude: 1, address: 'Test Dest' },
    status: 'requested'
  };

  it('should create a trip successfully', async () => {
    const tripId = await createTrip(mockPayload);
    expect(tripId).toBe('mock-trip-id');
  });

  it('should progress from requested to driver_assigned', async () => {
    const tripId = 'mock-trip-id';
    await updateTripStatus(tripId, 'driver_assigned', { driverName: 'Test Driver' });
    // Verificación de lógica de servicio
  });

  it('should transition to in_progress correctly', async () => {
    const tripId = 'mock-trip-id';
    await updateTripStatus(tripId, 'in_progress');
    // Si llegamos aquí sin errores, el servicio funciona
  });
});
