import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { HomeScreen } from '@/screens/HomeScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { useAppSelector } from '@/store/hooks';

const Tab = createBottomTabNavigator();

const renderTabBarIcon = (route) => ({ focused, color, size }) => {
  let iconName;

  if (route.name === 'Home') {
    iconName = focused ? 'car-sport' : 'car-sport-outline';
  } else if (route.name === 'History') {
    iconName = focused ? 'time' : 'time-outline';
  } else if (route.name === 'Profile') {
    iconName = focused ? 'person' : 'person-outline';
  } else if (route.name === 'Register' || route.name === 'Auth') {
    iconName = focused ? 'person-add' : 'person-add-outline';
  }

  return (
    <View style={focused ? styles.activeIconContainer : null}>
      <Ionicons name={iconName} size={size} color={color} />
    </View>
  );
};

export function AppTabs() {
    const { t } = useTranslation();
    const { userId } = useAppSelector(state => state.auth);

    return (
      <Tab.Navigator 
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#111827',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
          tabBarIcon: renderTabBarIcon(route),
        })}
      >
        {userId ? (
          <>
            <Tab.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: t('home') }}
            />
            <Tab.Screen 
              name="History" 
              component={HistoryScreen} 
              options={{ title: t('history') }}
            />
            <Tab.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ title: t('profile') }}
            />
          </>
        ) : (
          <>
            <Tab.Screen 
              name="Auth" 
              component={LoginScreen} 
              options={{ title: t('login') }}
            />
            <Tab.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ title: t('register') }}
            />
          </>
        )}
      </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        elevation: 10,
        backgroundColor: '#ffffff',
        borderRadius: 25,
        height: 70,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        paddingTop: 10,
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: -5,
        marginBottom: 5,
    },
    activeIconContainer: {
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderRadius: 15,
        marginBottom: 5,
    }
});
