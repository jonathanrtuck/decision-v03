import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { transcribeAudio } from "./services/transcriptionService";
import { OPENAI_API_KEY } from "./config/openaiConfig";

const HAS_API_KEY = OPENAI_API_KEY && OPENAI_API_KEY.length > 0;

export default function SpeechToTextApp() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const startRecording = async () => {
    // Check if API key is configured
    if (!HAS_API_KEY) {
      setError(
        "OpenAI API key is not configured. Please add it to your .env file."
      );
      return;
    }

    try {
      // Reset states
      setIsRecording(true);
      setIsProcessing(true);
      setTranscript("");
      setError(null);

      // Set up recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);

      setIsProcessing(false);
    } catch (error) {
      setError("Failed to start recording. Please try again.");
      setIsProcessing(false);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsProcessing(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        try {
          // Send audio to OpenAI Whisper API for transcription
          const transcribedText = await transcribeAudio(uri);
          setTranscript(transcribedText);
        } catch (transcriptionError) {
          setError(
            "Failed to transcribe audio. Please check your API key and try again."
          );
        }
      } else {
        setError("No audio recorded. Please try again.");
      }

      setRecording(null);
    } catch (error) {
      setError("Failed to process the recording. Please try again.");
    } finally {
      setIsProcessing(false);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting microphone permission…</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>Permission to access the microphone was denied.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>OpenAI Whisper Speech-to-Text</Text>
        {!HAS_API_KEY && (
          <Text style={styles.apiKeyWarning}>⚠️ API key not configured</Text>
        )}
      </View>
      <View style={styles.transcriptContainer}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.processingText}>
              {isRecording ? "Listening…" : "Transcribing audio…"}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.transcript}>
              {transcript || "Press the button and start speaking…"}
            </Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title={isRecording ? "Stop Recording" : "Start Recording"}
          onPress={isRecording ? stopRecording : startRecording}
          color={isRecording ? "#FF6347" : "#4CAF50"}
          disabled={isProcessing && !isRecording}
        />
      </View>
      <Text style={styles.noteText}>
        {HAS_API_KEY
          ? "OpenAI API key is configured ✓"
          : "Set your OpenAI API key in the .env file"}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    padding: 20,
    backgroundColor: "#2196F3",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  apiKeyWarning: {
    color: "#FFF",
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
    fontSize: 12,
  },
  transcriptContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  transcript: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
  },
  buttonContainer: {
    margin: 20,
  },
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
  noteText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
});
