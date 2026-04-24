import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const categories = [
  { id: 'economy', icon: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png' },
  { id: 'xl', icon: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png' },
  { id: 'premium', icon: 'https://cdn-icons-png.flaticon.com/512/2736/2736933.png' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VehicleSelector({ value, onChange }) {
    const { t } = useTranslation();

    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('selectVehicle')}</Text>
        <View style={styles.row}>
          {categories.map(category => (
            <VehicleItem
              key={category.id}
              category={category}
              isSelected={value === category.id}
              onPress={() => onChange(category.id)}
              t={t}
            />
          ))}
        </View>
      </View>
    );
}

function VehicleItem({ category, isSelected, onPress, t }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.05 : 1);
  }, [isSelected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: withTiming(isSelected ? '#111827' : '#e5e7eb'),
    backgroundColor: withTiming(isSelected ? '#f9fafb' : '#ffffff'),
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.option, animatedStyle]}
    >
      <Image source={{ uri: category.icon }} style={styles.icon} />
      <Text style={[
          styles.optionText,
          isSelected && styles.selectedText,
      ]}>
        {t(category.id)}
      </Text>
      {isSelected && <View style={styles.badge} />}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
        marginVertical: 8,
    },
    title: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '800',
        paddingHorizontal: 4,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    option: {
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 2,
        flex: 1,
        paddingVertical: 12,
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    icon: {
        width: 40,
        height: 40,
        marginBottom: 8,
        resizeMode: 'contain',
    },
    optionText: {
        color: '#4b5563',
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'capitalize',
    },
    selectedText: {
        color: '#111827',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#111827',
    },
});
