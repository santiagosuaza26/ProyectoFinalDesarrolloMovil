import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Trip, VehicleCategory, PlaceLocation, RouteEstimate} from '@/types/models';

type TripState = {
  origin?: PlaceLocation;
  destination?: PlaceLocation;
  estimate?: RouteEstimate;
  selectedVehicle: VehicleCategory;
  activeTrip?: Trip;
};

const initialState: TripState = {
  selectedVehicle: 'economy',
};

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    setOrigin(state, action: PayloadAction<PlaceLocation | undefined>) {
      state.origin = action.payload;
    },
    setDestination(state, action: PayloadAction<PlaceLocation | undefined>) {
      state.destination = action.payload;
    },
    setEstimate(state, action: PayloadAction<RouteEstimate | undefined>) {
      state.estimate = action.payload;
    },
    setSelectedVehicle(state, action: PayloadAction<VehicleCategory>) {
      state.selectedVehicle = action.payload;
    },
    setActiveTrip(state, action: PayloadAction<Trip | undefined>) {
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

export const {
  setOrigin,
  setDestination,
  setEstimate,
  setSelectedVehicle,
  setActiveTrip,
  resetTripRequest,
} = tripSlice.actions;

export default tripSlice.reducer;
