import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tripReducer from './slices/tripSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    trip: tripReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar estas rutas de acciones de Firebase/Firestore
        ignoredActions: ['auth/setProfile', 'trip/setEstimate'],
        // Ignorar estos caminos específicos en el estado global
        ignoredPaths: ['auth.profile.createdAt', 'auth.profile.updatedAt', 'trip.estimate'],
      },
    }),
});
