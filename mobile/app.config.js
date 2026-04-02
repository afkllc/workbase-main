const { version } = require('./package.json');

module.exports = {
  expo: {
    name: 'Workbase Mobile',
    slug: 'workbase-mobile',
    version,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.workbase.mobile',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.workbase.mobile',
      permissions: ['android.permission.RECORD_AUDIO'],
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-image-picker',
        {
          cameraPermission: 'Allow Workbase to access your camera so inspection images can be captured.',
          photosPermission: 'Allow Workbase to access your photo library so inspection images can be uploaded.',
        },
      ],
      'expo-font',
    ],
    scheme: 'workbase-mobile',
    extra: {
      appVersion: version,
      router: {},
      eas: {
        projectId: '063ccaa9-1be4-4d60-bb5b-9862ec2b8f68',
      },
    },
  },
};
