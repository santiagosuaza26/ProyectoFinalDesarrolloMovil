import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';
import type {AppTabParamList} from '@/types/navigation';
import {HomeScreen} from '@/screens/HomeScreen';
import {HistoryScreen} from '@/screens/HistoryScreen';
import {ProfileScreen} from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  const {t} = useTranslation();

  return (
    <Tab.Navigator screenOptions={{headerShown: true}}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: t('home')}}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{title: t('history')}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: t('profile')}}
      />
    </Tab.Navigator>
  );
}
