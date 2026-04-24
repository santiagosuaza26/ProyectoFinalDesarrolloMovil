import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {VehicleCategory} from '@/types/models';

const categories: VehicleCategory[] = ['economy', 'xl', 'premium'];

type Props = {
  value: VehicleCategory;
  onChange: (category: VehicleCategory) => void;
};

export function VehicleSelector({value, onChange}: Props) {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('selectVehicle')}</Text>
      <View style={styles.row}>
        {categories.map(category => (
          <Pressable
            key={category}
            onPress={() => onChange(category)}
            style={[
              styles.option,
              value === category && styles.selectedOption,
            ]}>
            <Text
              style={[
                styles.optionText,
                value === category && styles.selectedText,
              ]}>
              {t(category)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  selectedOption: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  optionText: {
    color: '#111827',
    fontWeight: '700',
  },
  selectedText: {
    color: '#ffffff',
  },
});
