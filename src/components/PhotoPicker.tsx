import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AppButton} from './AppButton';

type Props = {
  photoUrl?: string;
  onPick: () => Promise<void>;
  required?: boolean;
  error?: string;
  loading?: boolean;
};

export function PhotoPicker({photoUrl, onPick, required, error, loading}: Props) {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{t('photo')}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
      </View>
      <View style={styles.photoRow}>
        {photoUrl ? (
          <Image source={{uri: photoUrl}} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Text style={styles.placeholderText}>No photo</Text>
          </View>
        )}
        <AppButton
          onPress={onPick}
          title={photoUrl ? t('changPhoto') : t('selectPhoto')}
          variant="secondary"
          style={styles.photoButton}
          loading={loading}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  required: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },
  photoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  photo: {
    borderRadius: 8,
    height: 80,
    width: 80,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  placeholder: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  photoButton: {
    flex: 1,
  },
  error: {
    color: '#dc2626',
    fontSize: 12,
  },
});
