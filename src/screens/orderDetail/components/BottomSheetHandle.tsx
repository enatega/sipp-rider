import React, { useMemo } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeProvider';

const SWIPE_THRESHOLD = 12;

interface Props {
  expanded: boolean;
  onToggle: (nextExpanded: boolean) => void;
  expandLabel: string;
  collapseLabel: string;
}

export default function BottomSheetHandle({ expanded, onToggle, expandLabel, collapseLabel }: Props) {
  const { theme } = useAppTheme();

  // Swipe up expands, swipe down collapses; a plain tap toggles via the Pressable.
  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > SWIPE_THRESHOLD,
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy < -SWIPE_THRESHOLD && !expanded) onToggle(true);
        else if (gesture.dy > SWIPE_THRESHOLD && expanded) onToggle(false);
      },
    }),
    [expanded, onToggle],
  );

  return (
    <View {...panResponder.panHandlers}>
      <Pressable
        onPress={() => onToggle(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={expanded ? collapseLabel : expandLabel}
        accessibilityState={{ expanded }}
        hitSlop={{ top: 8, bottom: 8 }}
        style={styles.touchArea}
      >
        <View style={[styles.grip, { backgroundColor: theme.colors.gray300 }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    minHeight: 28,
    marginTop: -8,
    marginHorizontal: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grip: {
    width: 40,
    height: 5,
    borderRadius: 999,
  },
});
