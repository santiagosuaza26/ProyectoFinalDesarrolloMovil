import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {Gender} from '@/types/models';
import {AppButton} from './AppButton';

type Props = {
  value: Gender | '';
  onChange: (gender: Gender) => void;
  error?: string;
};

const genders: Array<{value: Gender; labelKey: string}> = [
  {value: 'female', labelKey: 'female'},
  {value: 'male', labelKey: 'male'},
  {value: 'non_binary', labelKey: 'nonBinary'},
  {value: 'prefer_not_to_say', labelKey: 'preferNotToSay'},
];

export function GenderPicker({value, onChange, error}: Props) {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('gender')}</Text>
      <View style={styles.grid}>
        {genders.map(gender => (
          <AppButton
            key={gender.value}
            onPress={() => onChange(gender.value)}
            title={t(gender.labelKey)}
            variant={value === gender.value ? 'primary' : 'secondary'}
            style={styles.button}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flex: 0.48,
    minHeight: 44,
  },
  error: {
    color: '#dc2626',
    fontSize: 12,
  },
});
