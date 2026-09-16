const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? 'DUMMY_GOOGLE_MAPS_API_KEY';

module.exports = {
  expo: {
    name: 'Sip Rider',
    slug: 'enatega-deliveries-rider-app',
    version: '1.0.0',
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
      bundleIdentifier: 'com.enatega.deliveries.rider',
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
        'expo-location',
        {
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
          isIosBackgroundLocationEnabled: true,
          locationAlwaysAndWhenInUsePermission: 'Allow Sip Rider to share your location during an active delivery, including while navigation is open.',
          locationWhenInUsePermission: 'Allow Sip Rider to share your live location while you deliver an active order.',
        },
      ],
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
