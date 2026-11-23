import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { launchSplashColor } from '../theme/colors';

const SPLASH_GIF = require('../../assets/splash.gif');
// splash.gif runs ~2.8 s. The Pohanch logo settles at ~1.8 s, so fading out from 2.2 s
// finishes on the settled frame, before the animation ends.
const HOLD_AFTER_LOAD_MS = 2200;
// If the GIF fails to load, the app is not kept behind the splash.
const LOAD_TIMEOUT_MS = 1500;
const FADE_DURATION_MS = 250;

// Shown over the app at launch. The native splash is the GIF's first frame, so the handoff is invisible.
export default function LaunchSplash() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }, hasLoaded ? HOLD_AFTER_LOAD_MS : LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [hasLoaded, opacity]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Image
        source={SPLASH_GIF}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        autoplay
        onLoad={() => setHasLoaded(true)}
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: launchSplashColor,
  },
});
