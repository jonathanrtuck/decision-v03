import axios from "axios";
import {
  OPENAI_API_KEY,
  OPENAI_API_URLS,
  WHISPER_MODEL,
} from "../config/openaiConfig";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  isRecognitionAvailable,
  supportsOnDeviceRecognition,
} from "expo-speech-recognition";

interface TranscriptionResponse {
  text: string;
}

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
    // Handle web platform differently
    if (Platform.OS === "web") {
      // For web demo, return a simulated response
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call delay
      return "This is a simulated transcription for web demo. For full functionality, please use a mobile device.";
    }

    // Use native iOS speech recognition if available
    if (Platform.OS === "ios" && isRecognitionAvailable()) {
      const iosTranscription = await transcribeWithNativeSpeechRecognition(
        audioUri
      );
      if (iosTranscription) {
        return iosTranscription;
      }
      // If iOS speech recognition fails, fall back to Whisper
    }

    // Continue with Whisper API for Android or fallback
    return await transcribeWithWhisper(audioUri);
  } catch (error) {
    throw new Error("Failed to transcribe audio");
  }
};

const transcribeWithNativeSpeechRecognition = async (
  audioUri: string
): Promise<string | null> => {
  try {
    // Request speech recognition permissions
    const permissions =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permissions.granted) {
      console.warn("Speech recognition permissions not granted");
      return null;
    }

    // Check if the file exists
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      throw new Error("Audio file does not exist");
    }

    return new Promise((resolve, reject) => {
      // Set up result listener
      const resultListener = ExpoSpeechRecognitionModule.addListener(
        "result",
        (event) => {
          if (event.results && event.results.length > 0 && event.isFinal) {
            // Get the transcript from the results
            const transcript = event.results[0].transcript;

            // Clean up listeners
            resultListener.remove();
            errorListener.remove();
            endListener.remove();

            resolve(transcript);
          }
        }
      );

      // Set up error listener
      const errorListener = ExpoSpeechRecognitionModule.addListener(
        "error",
        (event) => {
          console.error(
            "Speech recognition error:",
            event.error,
            event.message
          );

          // Clean up listeners
          resultListener.remove();
          errorListener.remove();
          endListener.remove();

          reject(new Error(`Speech recognition error: ${event.message}`));
        }
      );

      // Set up end listener to make sure we always clean up
      const endListener = ExpoSpeechRecognitionModule.addListener("end", () => {
        // If we get here without a result, fall back to Whisper
        // Clean up listeners
        resultListener.remove();
        errorListener.remove();
        endListener.remove();

        resolve(null); // Return null to trigger fallback
      });

      // Start speech recognition with the audio file
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        // Use on-device recognition if supported
        requiresOnDeviceRecognition: supportsOnDeviceRecognition(),
        // Set up file transcription
        audioSource: {
          uri: audioUri,
          // Audio configuration options
          // These are typical defaults, actual file settings may vary
          audioChannels: 1,
          sampleRate: 16000,
        },
      });
    });
  } catch (error) {
    console.error("Error in native speech recognition:", error);
    return null; // Return null to trigger fallback to Whisper
  }
};

const transcribeWithWhisper = async (audioUri: string): Promise<string> => {
  // Check if the file exists
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) {
    throw new Error("Audio file does not exist");
  }

  // Create form data
  const formData = new FormData();

  // Add the audio file
  // The API requires either a binary audio file (< 25 MB) or a multipart/form-data request
  formData.append("file", {
    uri: audioUri,
    type: "audio/m4a", // Adjust based on your recording format
    name: "audio.m4a",
  } as any);

  // Specify the model
  formData.append("model", WHISPER_MODEL);

  // Make API request
  const response = await axios.post<TranscriptionResponse>(
    OPENAI_API_URLS.whisper,
    formData,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  // Return the transcribed text
  return response.data.text;
};
