const googleMapsApiKey =
  process.env.GOOGLE_MAPS_API_KEY ?? "DUMMY_GOOGLE_MAPS_API_KEY";

module.exports = {
  expo: {
    name: "Pohanch Rider",
    slug: "sipp-rider",
    owner: "ninjas_code",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-launch.png",
      resizeMode: "cover",
      backgroundColor: "#F7E300",
    },
    ios: {
      buildNumber: "8",
      supportsTablet: true,
      bundleIdentifier: "com.enatega.deliveries.rider",
      splash: {
        image: "./assets/splash-launch.png",
        resizeMode: "cover",
        backgroundColor: "#F7E300",
      },
      // iOS shows the icon edge to edge, so this copy crops the margin away to match Android's framing.
      icon: "./assets/ios-icon.png",
      config: {
        googleMapsApiKey,
      },
    },
    android: {
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        monochromeImage: "./assets/adaptive-icon-monochrome.png",
        backgroundColor: "#F7E300",
      },
      splash: {
        image: "./assets/splash-launch.png",
        resizeMode: "cover",
        backgroundColor: "#F7E300",
      },
      package: "com.enatega.deliveries.rider",
      googleServicesFile: "./google-services.json",
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "resize",
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    updates: {
      url: "https://u.expo.dev/bdc9815d-60c7-4320-9dfc-3430ab55eb81",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    plugins: [
      // Portrait lock and netinfo's Wi-Fi permission make Play treat these features as required; mark them optional.
      [
        "./plugins/withOptionalHardwareFeatures",
        {
          // Camera is used only for document and chat photos, which also accept gallery images.
          extraFeatures: ["android.hardware.camera", "android.hardware.camera.autofocus"],
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          sounds: [
            "./assets/sound/beep3.mp3",
            "./assets/sound/new_order_chime.wav",
            "./assets/sound/new_order_beep.wav",
            "./assets/sound/new_order_beep_5s.wav",
          ],
        },
      ],
      "expo-secure-store",
      [
        "expo-location",
        {
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
          isIosBackgroundLocationEnabled: true,
          locationAlwaysAndWhenInUsePermission:
            "Allow Pohanch Rider to share your location during an active delivery, including while navigation is open.",
          locationWhenInUsePermission:
            "Allow Pohanch Rider to share your live location while you deliver an active order.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow $(PRODUCT_NAME) to select photos for delivery chats and documents.",
          cameraPermission:
            "Allow $(PRODUCT_NAME) to take photos for delivery chats and documents.",
          microphonePermission: false,
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "bdc9815d-60c7-4320-9dfc-3430ab55eb81",
      },
    },
  },
};
