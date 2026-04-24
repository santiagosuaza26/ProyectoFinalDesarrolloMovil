import { createSlice, createSelector } from '@reduxjs/toolkit';
import { calculateEstimatedFare } from '@/utils/fare';

const initialState = {
    origin: null,
    destination: null,
    estimate: null,
    selectedVehicle: 'economy',
    activeTrip: null,
};

const tripSlice = createSlice({
    name: 'trip',
    initialState,
    reducers: {
        setOrigin(state, action) {
            state.origin = action.payload;
        },
        setDestination(state, action) {
            state.destination = action.payload;
        },
        setEstimate(state, action) {
            state.estimate = action.payload;
        },
        setSelectedVehicle(state, action) {
            state.selectedVehicle = action.payload;
        },
        setActiveTrip(state, action) {
            state.activeTrip = action.payload;
        },
        resetTripRequest(state) {
            state.destination = null;
            state.estimate = null;
            state.activeTrip = null;
            state.selectedVehicle = 'economy';
        },
    },
});

// Selectores básicos (Inputs para selectores memorizados)
const selectTripState = (state) => state.trip;

export const selectOrigin = createSelector([selectTripState], (trip) => trip.origin);
export const selectDestination = createSelector([selectTripState], (trip) => trip.destination);
export const selectEstimate = createSelector([selectTripState], (trip) => trip.estimate);
export const selectSelectedVehicle = createSelector([selectTripState], (trip) => trip.selectedVehicle);
export const selectActiveTrip = createSelector([selectTripState], (trip) => trip.activeTrip);

// Selector memorizado para cálculos derivados
export const selectEstimatedFare = createSelector(
    [selectEstimate, selectSelectedVehicle],
    (estimate, vehicle) => {
        if (!estimate) return 0;
        return calculateEstimatedFare(estimate.distanceKm, estimate.durationMinutes, vehicle);
    }
);

export const { 
    setOrigin, 
    setDestination, 
    setEstimate, 
    setSelectedVehicle, 
    setActiveTrip, 
    resetTripRequest 
} = tripSlice.actions;

export default tripSlice.reducer;
