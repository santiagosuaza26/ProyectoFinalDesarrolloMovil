import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

const CAR_ICON = 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png';

export function SearchingDriver() {
    const { t } = useTranslation();
    const ring1 = useSharedValue(0);
    const ring2 = useSharedValue(0);
    const ring3 = useSharedValue(0);

    useEffect(() => {
        ring1.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }), -1);
        ring2.value = withDelay(500, withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }), -1));
        ring3.value = withDelay(1000, withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }), -1));
    }, []);

    const ring1Style = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(ring1.value, [0, 1], [0.5, 2.5]) }],
        opacity: interpolate(ring1.value, [0, 1], [0.8, 0]),
    }));

    const ring2Style = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(ring2.value, [0, 1], [0.5, 2.5]) }],
        opacity: interpolate(ring2.value, [0, 1], [0.8, 0]),
    }));

    const ring3Style = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(ring3.value, [0, 1], [0.5, 2.5]) }],
        opacity: interpolate(ring3.value, [0, 1], [0.8, 0]),
    }));

    return (
        <View style={styles.container}>
            <View style={styles.radarContainer}>
                <Animated.View style={[styles.ring, ring1Style]} />
                <Animated.View style={[styles.ring, ring2Style]} />
                <Animated.View style={[styles.ring, ring3Style]} />
                <View style={styles.carCircle}>
                    <Image source={{ uri: CAR_ICON }} style={styles.carIcon} />
                </View>
            </View>
            <Text style={styles.searchingText}>{t('searchingDriver') || 'Buscando conductores cercanos...'}</Text>
            <Text style={styles.locationText}>Medellín, Antioquia</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    radarContainer: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#111827',
        backgroundColor: 'rgba(17, 24, 39, 0.1)',
    },
    carCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    carIcon: {
        width: 35,
        height: 35,
        tintColor: '#ffffff',
    },
    searchingText: {
        marginTop: 40,
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
        textAlign: 'center',
    },
    locationText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
        marginTop: 5,
    }
});
