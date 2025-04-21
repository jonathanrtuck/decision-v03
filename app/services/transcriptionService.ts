import axios from "axios";
import {
  OPENAI_API_KEY,
  OPENAI_API_URLS,
  WHISPER_MODEL,
} from "../config/openaiConfig";
import * as FileSystem from "expo-file-system";

interface TranscriptionResponse {
  text: string;
}

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
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

    // Optional parameters
    // formData.append('language', 'en'); // Specify language if known
    // formData.append('prompt', ''); // Optional prompt for the model

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
  } catch (error) {
    console.error("Transcription error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("API Error:", error.response.data);
    }
    throw new Error("Failed to transcribe audio");
  }
};
