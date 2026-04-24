import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {UserProfile} from '@/types/models';

type AuthState = {
  userId?: string;
  profile?: UserProfile;
  initializing: boolean;
};

const initialState: AuthState = {
  initializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticatedUser(state, action: PayloadAction<string | undefined>) {
      state.userId = action.payload;
      state.initializing = false;
    },
    setProfile(state, action: PayloadAction<UserProfile | undefined>) {
      state.profile = action.payload;
    },
    clearSession(state) {
      state.userId = undefined;
      state.profile = undefined;
      state.initializing = false;
    },
  },
});

export const {setAuthenticatedUser, setProfile, clearSession} =
  authSlice.actions;

export default authSlice.reducer;
