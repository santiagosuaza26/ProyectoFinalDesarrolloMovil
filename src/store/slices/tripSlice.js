import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    selectedVehicle: 'economy',
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
            state.destination = undefined;
            state.estimate = undefined;
            state.activeTrip = undefined;
            state.selectedVehicle = 'economy';
        },
    },
});
export const { setOrigin, setDestination, setEstimate, setSelectedVehicle, setActiveTrip, resetTripRequest, } = tripSlice.actions;
export default tripSlice.reducer;
