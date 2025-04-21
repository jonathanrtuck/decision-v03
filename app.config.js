import "dotenv/config";

// Get API key from environment variables
const apiKey = process.env.OPENAI_API_KEY || "";

export default {
  expo: {
    assetBundlePatterns: ["**/*"],
    experiments: { typedRoutes: true },
    // Pass environment variables directly to the app
    extra: {
      openaiApiKey: apiKey,
      eas: { projectId: process.env.EAS_PROJECT_ID || "" },
      router: { origin: false },
    },
    // App icons and splash screens
    icon: "./assets/app-icons/ios/app-store-icon.png",
    splash: {
      image: "./assets/splash/splash-1242x2688.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },
    ios: {
      buildNumber: "0.3.0",
      bundleIdentifier: "com.decisiondating.v03",
      icon: "./assets/app-icons/ios/app-store-icon.png",
      infoPlist: {
        NSMicrophoneUsageDescription:
          "This app needs access to your microphone to record audio for transcription.",
        ITSAppUsesNonExemptEncryption: false,
      },
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/app-icons/android/adaptive-foreground.png",
        backgroundColor: "#FFFFFF",
      },
      package: "com.decisiondating.v03",
      versionCode: 1,
      permissions: ["android.permission.RECORD_AUDIO"],
    },
    name: "decision-v03",
    newArchEnabled: true,
    orientation: "portrait",
    owner: "jonathanrtuck",
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff",
          image: "./assets/splash/splash-1242x2688.png",
          imageWidth: 500,
          resizeMode: "contain",
        },
      ],
      [
        "expo-speech-recognition",
        {
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone for speech recognition",
        },
      ],
    ],
    scheme: "myapp",
    slug: "decision-v03",
    userInterfaceStyle: "automatic",
    version: "0.3.0",
    web: {
      bundler: "metro",
      favicon: "./assets/app-icons/ios/icon-76x76@1x.png",
      output: "static",
    },
  },
};
