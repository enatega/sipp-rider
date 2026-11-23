import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 20;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 4;

export default function ToggleSwitch({ value, onValueChange, disabled = false }: Props) {
  const { theme } = useAppTheme();
  const translateX = useRef(new Animated.Value(value ? THUMB_TRAVEL : 2)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? THUMB_TRAVEL : 2,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  const trackColor = value ? theme.colors.secondary : theme.colors.gray300;

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[
        styles.track,
        {
          backgroundColor: trackColor,
          opacity: disabled ? 0.5 : 1,
          borderColor: value ? theme.colors.secondary : theme.colors.gray300,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX }],
            backgroundColor: theme.colors.white,
            shadowColor: theme.colors.black,
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
