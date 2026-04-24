import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppTabs } from './AppTabs';
import { TripDetailScreen } from '@/screens/TripDetailScreen';
import { TripTrackingScreen } from '@/screens/TripTrackingScreen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAuthenticatedUser, setProfile } from '@/store/slices/authSlice';
import { onAuthChanged } from '@/services/authService';
import { listenToUserProfile } from '@/services/userService';
const Stack = createNativeStackNavigator();
export function RootNavigator() {
    const dispatch = useAppDispatch();
    const { i18n, t } = useTranslation();
    const { userId, profile, initializing } = useAppSelector(state => state.auth);
    useEffect(() => {
        return onAuthChanged(nextUserId => {
            dispatch(setAuthenticatedUser(nextUserId));
        });
    }, [dispatch]);
    useEffect(() => {
        if (!userId) {
            dispatch(setProfile(undefined));
            return undefined;
        }
        return listenToUserProfile(userId, nextProfile => {
            dispatch(setProfile(nextProfile));
        });
    }, [dispatch, userId]);
    useEffect(() => {
        if (profile?.preferredLanguage) {
            i18n.changeLanguage(profile.preferredLanguage);
        }
    }, [i18n, profile?.preferredLanguage]);
    if (initializing) {
        return (<View style={styles.loader}>
        <ActivityIndicator size="large"/>
      </View>);
    }
    return (<NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={AppTabs}/>
        <Stack.Screen name="TripTracking" component={TripTrackingScreen} options={{ headerShown: true, title: t('status') }}/>
        <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ headerShown: true, title: t('tripDetail') }}/>
      </Stack.Navigator>
    </NavigationContainer>);
}
const styles = StyleSheet.create({
    loader: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
});
