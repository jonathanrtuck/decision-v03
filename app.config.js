import "dotenv/config";

const openaiApiKey = process.env.OPENAI_API_KEY || "";
const projectId = process.env.EAS_PROJECT_ID || "";

export default {
  expo: {
    android: {
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/app-icons/android/adaptive-foreground.png",
      },
      package: "com.decisiondating.v03",
      permissions: ["android.permission.RECORD_AUDIO"],
      versionCode: 1,
    },
    assetBundlePatterns: ["**/*"],
    experiments: { typedRoutes: true },
    // Pass environment variables directly to the app
    extra: {
      openaiApiKey,
      eas: { projectId },
      router: { origin: false },
    },
    // App icons and splash screens
    icon: "./assets/app-icons/ios/app-store-icon.png",
    ios: {
      buildNumber: "0.3.0",
      bundleIdentifier: "com.decisiondating.v03",
      hermesBuildFlags: ["-O", "-output-source-map"],
      icon: "./assets/app-icons/ios/app-store-icon.png",
      infoPlist: {
        NSMicrophoneUsageDescription:
          "This app needs access to your microphone to record audio for transcription.",
        NSSpeechRecognitionUsageDescription:
          "This app uses speech recognition to transcribe your audio to text.",
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          "This app doesn't use your photo library directly, but one of our dependencies requires this permission.",
        UIBackgroundModes: [],
      },
      jsEngine: "hermes",
      supportsTablet: true,
      usesApnsToken: false,
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
    splash: {
      backgroundColor: "#FFFFFF",
      image: "./assets/splash/splash-1242x2688.png",
      resizeMode: "contain",
    },
    userInterfaceStyle: "automatic",
    version: "0.3.0",
    web: {
      bundler: "metro",
      favicon: "./assets/app-icons/ios/icon-76x76@1x.png",
      output: "static",
    },
  },
};
