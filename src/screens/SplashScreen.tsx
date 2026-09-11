import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { lightColors } from '../theme/colors';

const BG_IMAGE_URI =
  'http://localhost:3845/assets/4170dc3471aa1409d50c9ae0c261d502b57bc2fb.png';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: BG_IMAGE_URI }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.splashBackground,
  },
});
