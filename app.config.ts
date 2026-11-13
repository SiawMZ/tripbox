import type { ConfigContext, ExpoConfig } from 'expo/config';

// app.json holds the config; this adds what must not be in git. The Android Google Maps key comes from the
// GOOGLE_MAPS_ANDROID_KEY env var (.env.local locally, an EAS environment variable for builds). Restrict that key
// in Google Cloud to "Maps SDK for Android" and to package com.siawmz.tripbox with the build's SHA-1.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  // Without a key the Android map would crash; the app shows a note instead.
  extra: { ...config.extra, mapsKeySet: !!process.env.GOOGLE_MAPS_ANDROID_KEY },
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY ?? '' }],
  ],
});
