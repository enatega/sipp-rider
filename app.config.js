const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? 'DUMMY_GOOGLE_MAPS_API_KEY';

module.exports = {
  expo: {
    name: 'Sipp Rider',
    slug: 'sipp-rider',
    owner: "ninjas_code",
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
      bundleIdentifier: 'com.sipp.delivery.ios.rider',
      infoPlist: {
        UIBackgroundModes: ['audio', 'location'],
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
      package: 'com.sipp.delivery.ios.rider',
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
      url: 'https://u.expo.dev/bdc9815d-60c7-4320-9dfc-3430ab55eb81',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: [
      [
        'expo-notifications',
        { sounds: ['./assets/sound/beep3.mp3'] },
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
        projectId: 'bdc9815d-60c7-4320-9dfc-3430ab55eb81',
      },
    },
  },
};
