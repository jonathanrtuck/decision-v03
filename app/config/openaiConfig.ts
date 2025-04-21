import Constants from "expo-constants";

// Get the API key from Constants.expoConfig.extra
const extra = Constants.expoConfig?.extra || {};
export const OPENAI_API_KEY = extra.openaiApiKey || "";

// Debug information (not revealing the full key)
console.log("===== API KEY STATUS =====");
console.log("API Key set:", !!OPENAI_API_KEY);
console.log("API Key length:", OPENAI_API_KEY?.length || 0);
if (OPENAI_API_KEY && OPENAI_API_KEY.length > 0) {
  console.log("Key starts with:", OPENAI_API_KEY.substring(0, 5) + "...");
} else {
  console.log("TROUBLESHOOTING: Key is missing or empty");
  console.log("- Check that .env file has OPENAI_API_KEY=your-api-key");
  console.log("- Restart the Expo server with: npm start --clear");
}

// API endpoints
export const OPENAI_API_URLS = {
  whisper: "https://api.openai.com/v1/audio/transcriptions",
};

// Model specification
export const WHISPER_MODEL = "whisper-1";
