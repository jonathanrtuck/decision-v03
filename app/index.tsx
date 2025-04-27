import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OPENAI_API_KEY } from "./config/openaiConfig";
import { transcribeAudio } from "./services/transcriptionService";

const HAS_API_KEY = OPENAI_API_KEY && OPENAI_API_KEY.length > 0;

export default function App() {
  const router = useRouter();
  const [buttonScale] = useState<Animated.Value>(new Animated.Value(1));
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const getStatusMessage = () => {
    if (transcript) return transcript;
    if (isRecording) return "Listening… Release when finished speaking";
    return "Press and hold the button to start speaking";
  };
  const startRecording = async () => {
    // Check if API key is configured - only needed for Whisper fallback
    if (!HAS_API_KEY && Platform.OS !== "ios") {
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

      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

      // Keep isProcessing true while recording
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
      // Update processing message
      setIsRecording(false);

      // Provide haptic feedback when stopping
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        try {
          // Send audio to transcription service (iOS native or OpenAI Whisper API)
          const transcribedText = await transcribeAudio(uri);

          // Check if we got an empty transcription result
          if (!transcribedText || transcribedText.trim() === "") {
            setError("No speech detected. Please try speaking again.");
          } else {
            setTranscript(transcribedText);
          }
        } catch (transcriptionError: any) {
          // Check for specific error messages that might indicate no speech
          if (
            transcriptionError.message &&
            (transcriptionError.message.includes("no speech") ||
              transcriptionError.message.includes("silence"))
          ) {
            setError("No speech detected. Please try speaking again.");
          } else {
            setError("Failed to transcribe audio. Please try again.");
            console.error("Transcription error:", transcriptionError);
          }
        }
      } else {
        setError("No audio recorded. Please try again.");
      }

      setRecording(null);
    } catch (error) {
      setError("Failed to process the recording. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  const onPressIn = async () => {
    if (isProcessing) return;

    Animated.spring(buttonScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 20,
    }).start();

    await startRecording();
  };
  const onPressOut = async () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();

    if (isRecording) {
      await stopRecording();
    }
  };

  useEffect(() => {
    (async () => {
      // Request microphone permission
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === "granted");

      // Request speech recognition permission for iOS
      if (Platform.OS === "ios") {
        try {
          const speechPermission =
            await ExpoSpeechRecognitionModule.requestPermissionsAsync();
          if (!speechPermission.granted) {
            console.warn("Speech recognition permission not granted");
          }
        } catch (error) {
          console.error(
            "Error requesting speech recognition permission:",
            error
          );
        }
      }
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
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.transcriptContainer}>
          {isProcessing && !isRecording ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.processingText}>Transcribing audio…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.transcript} selectable={true}>
                {getStatusMessage()}
              </Text>
              {error && <Text style={styles.errorText}>{error}</Text>}
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <ActivityIndicator size="small" color="#FF6347" />
                  <Text style={styles.recordingText}>Recording…</Text>
                </View>
              )}
            </>
          )}
        </View>
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.bleButton}
            onPress={() => router.push("/bluetooth" as any)}>
            <Text style={styles.bleButtonText}>Bluetooth Devices</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.button,
                isRecording ? styles.stopButton : styles.startButton,
                isProcessing && !isRecording && styles.disabledButton,
              ]}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={isProcessing && !isRecording}
              activeOpacity={0.7}
              delayPressIn={0}>
              <Text style={styles.buttonText}>
                {isRecording ? "Recording…" : "Hold to Record"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    alignItems: "center",
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 180,
  },
  startButton: {
    backgroundColor: "#4CAF50",
  },
  stopButton: {
    backgroundColor: "#FF6347",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
  recordingIndicator: {
    marginTop: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  recordingText: {
    color: "#FF6347",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  actionContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  bleButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    width: "100%",
    alignItems: "center",
  },
  bleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
