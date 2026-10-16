const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? 'DUMMY_GOOGLE_MAPS_API_KEY';

module.exports = {
  expo: {
    name: 'Sipp Rider',
    slug: 'sipp-rider',
    owner: "sipp-delivery",
    version: '1.0.3',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash-light.png',
      resizeMode: 'cover',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.sipp.rider.app',
      splash: {
        image: './assets/splash-light.png',
        resizeMode: 'cover',
        backgroundColor: '#ffffff',
        dark: {
          image: './assets/splash-dark.png',
          resizeMode: 'cover',
          backgroundColor: '#ffffff',
        },
      },
      config: {
        googleMapsApiKey,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      splash: {
        image: './assets/splash-light.png',
        resizeMode: 'cover',
        backgroundColor: '#ffffff',
        dark: {
          image: './assets/splash-dark.png',
          resizeMode: 'cover',
          backgroundColor: '#ffffff',
        },
      },
      package: 'com.sipp.rider.app',
      googleServicesFile: './google-services.json',
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: 'resize',
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    updates: {
      url: 'https://u.expo.dev/54910e7e-fa72-4582-aec7-a45f203f5873',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: [
      [
        'expo-notifications',
        { sounds: ['./assets/sound/beep3.mp3', './assets/sound/new_order_chime.wav', './assets/sound/new_order_beep.wav', './assets/sound/new_order_beep_5s.wav'] },
      ],
      'expo-secure-store',
      [
        'expo-location',
        {
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
          isIosBackgroundLocationEnabled: true,
          locationAlwaysAndWhenInUsePermission: 'Allow Sipp Rider to share your location during an active delivery, including while navigation is open.',
          locationWhenInUsePermission: 'Allow Sipp Rider to share your live location while you deliver an active order.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to select photos for delivery chats and documents.',
          cameraPermission: 'Allow $(PRODUCT_NAME) to take photos for delivery chats and documents.',
          microphonePermission: false,
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '54910e7e-fa72-4582-aec7-a45f203f5873',
      },
    },
  },
};
