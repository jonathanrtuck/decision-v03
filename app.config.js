import "dotenv/config";

// Get API key from environment variables
const apiKey = process.env.OPENAI_API_KEY || "";

export default {
  expo: {
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff",
        foregroundImage: "./assets/images/adaptive-icon.png",
      },
      permissions: ["android.permission.RECORD_AUDIO"],
    },
    assetBundlePatterns: ["**/*"],
    experiments: { typedRoutes: true },
    // Pass environment variables directly to the app
    extra: {
      openaiApiKey: apiKey,
      eas: { projectId: process.env.EAS_PROJECT_ID || "" },
      router: { origin: false },
    },
    icon: "./assets/images/icon.png",
    ios: {
      infoPlist: {
        NSMicrophoneUsageDescription:
          "This app needs access to your microphone to record audio for transcription.",
      },
      supportsTablet: true,
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
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
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
      favicon: "./assets/images/favicon.png",
      output: "static",
    },
  },
};
