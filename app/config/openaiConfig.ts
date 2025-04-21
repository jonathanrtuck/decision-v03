import Constants from "expo-constants";

// Get the API key from Constants.expoConfig.extra
const extra = Constants.expoConfig?.extra || {};
export const OPENAI_API_KEY = extra.openaiApiKey || "";

// API endpoints
export const OPENAI_API_URLS = {
  whisper: "https://api.openai.com/v1/audio/transcriptions",
};

// Model specification
export const WHISPER_MODEL = "whisper-1";
