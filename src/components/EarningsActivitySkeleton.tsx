import React from 'react';
import { StyleSheet, View } from 'react-native';
import { lightColors } from '../theme/colors';

const bone = { backgroundColor: lightColors.gray200 };

/** Placeholder rows shaped like EarningsActivityRow. Wrap in SkeletonPulse. */
export default function EarningsActivitySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, key) => (
        <View key={key} style={[styles.row, { borderBottomColor: lightColors.gray300 }]}>
          <View style={[styles.line, bone, { width: 84 }]} />
          <View style={[styles.line, bone, { width: 90 }]} />
          <View style={[styles.line, bone, { width: 56, marginLeft: 'auto' }]} />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
});
