import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    initializing: true,
};
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthenticatedUser(state, action) {
            state.userId = action.payload;
            state.initializing = false;
        },
        setProfile(state, action) {
            state.profile = action.payload;
        },
        clearSession(state) {
            state.userId = undefined;
            state.profile = undefined;
            state.initializing = false;
        },
    },
});
export const { setAuthenticatedUser, setProfile, clearSession } = authSlice.actions;
export default authSlice.reducer;
