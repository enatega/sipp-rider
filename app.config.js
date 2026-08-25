const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? 'DUMMY_GOOGLE_MAPS_API_KEY';

module.exports = {
  expo: {
    name: 'EnategaDeliveriesRiderApp',
    slug: 'enatega-deliveries-rider-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.enatega.deliveries.rider',
      config: {
        googleMapsApiKey,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.enatega.deliveries.rider',
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
      url: 'https://u.expo.dev/dd251847-b122-424b-b7dd-60bd8ddbbe90',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: [
      'expo-notifications',
      'expo-secure-store',
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to access your photos to upload documents.',
          cameraPermission: 'Allow $(PRODUCT_NAME) to use your camera to capture documents.',
          microphonePermission: false,
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'dd251847-b122-424b-b7dd-60bd8ddbbe90',
      },
    },
  },
};
