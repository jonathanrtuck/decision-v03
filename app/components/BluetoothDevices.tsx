import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Device } from "react-native-ble-plx";
import BleManager from "../services/bleManager";

export default function BluetoothDevices() {
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Not connected");
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const bleManager = BleManager.getInstance();

  const handleStatusChanged = () => {
    console.log("Status changed callback triggered");
    setDevices(bleManager.getDevices());
    setConnectionStatus(bleManager.getConnectionStatus());
    setIsScanning(bleManager.getIsScanning());
  };

  const startScan = () => {
    if (!isInitialized) {
      setError("Bluetooth is not initialized yet");
      return;
    }

    if (connectionStatus.includes("PoweredOff")) {
      Alert.alert(
        "Bluetooth is turned off",
        "Please enable Bluetooth in your device settings to scan for devices.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return;
    }

    if (connectionStatus.includes("Unauthorized")) {
      Alert.alert(
        "Bluetooth permission denied",
        "Please enable Bluetooth permissions in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return;
    }

    console.log("Starting scan...");
    setIsScanning(true);
    bleManager.startScan();
  };

  const stopScan = () => {
    console.log("Stopping scan...");
    bleManager.stopScan();
    setIsScanning(false);
  };

  const connectToDevice = async (deviceId: string) => {
    try {
      console.log("Connecting to device:", deviceId);
      await bleManager.connectToDevice(deviceId);
    } catch (error) {
      console.error("Error connecting to device:", error);
      setError("Failed to connect to device");
    }
  };

  const disconnectDevice = async () => {
    try {
      console.log("Disconnecting device");
      await bleManager.disconnectDevice();
    } catch (error) {
      console.error("Error disconnecting device:", error);
      setError("Failed to disconnect device");
    }
  };

  const requestAudioStreaming = async () => {
    try {
      console.log("Requesting audio streaming");
      const success = await bleManager.requestAudioStreaming();
      if (!success) {
        setError("Failed to start audio streaming");
      }
    } catch (error) {
      console.error("Error requesting audio streaming:", error);
      setError("Error starting audio streaming");
    }
  };

  // Check if Bluetooth is available based on status
  const isBluetoothAvailable = () => {
    return (
      connectionStatus.includes("Ready") ||
      connectionStatus.includes("Connected") ||
      (!connectionStatus.includes("Unknown") &&
        !connectionStatus.includes("Unsupported") &&
        !connectionStatus.includes("Unauthorized") &&
        !connectionStatus.includes("PoweredOff") &&
        !connectionStatus.includes("Resetting"))
    );
  };

  useEffect(() => {
    const initBle = async () => {
      try {
        console.log("Initializing BLE manager");
        setError(null);
        const initialized = await bleManager.init();
        console.log("BLE initialization result:", initialized);

        if (!initialized) {
          setError("Failed to initialize Bluetooth");
          return;
        }

        setIsInitialized(true);
        bleManager.onStatusChanged = handleStatusChanged;
        handleStatusChanged(); // Initial update
      } catch (error) {
        console.error("Failed to initialize BLE:", error);
        setError(
          "Failed to initialize Bluetooth: " +
            (error instanceof Error ? error.message : String(error))
        );
      }
    };

    initBle();

    return () => {
      console.log("Cleaning up BLE manager");
      bleManager.dispose();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Devices</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Text style={styles.status}>Status: {connectionStatus}</Text>

      <View style={styles.infoBox}>
        {connectionStatus.includes("Unknown") && (
          <Text style={styles.infoText}>
            Bluetooth state is unknown. Make sure Bluetooth is enabled and the
            app has permissions.
          </Text>
        )}
        {connectionStatus.includes("PoweredOff") && (
          <Text style={styles.infoText}>
            Bluetooth is turned off. Please enable Bluetooth in your device
            settings.
          </Text>
        )}
        {connectionStatus.includes("Unauthorized") && (
          <Text style={styles.infoText}>
            Bluetooth permissions not granted. Please enable them in settings.
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {!isScanning ? (
          <Button
            title="Scan for Devices"
            onPress={startScan}
            disabled={!isInitialized || !isBluetoothAvailable()}
          />
        ) : (
          <Button title="Stop Scanning" onPress={stopScan} />
        )}
        {connectionStatus.includes("Connected") && (
          <>
            <Button title="Disconnect" onPress={disconnectDevice} />
            <Button
              title="Start Audio Streaming"
              onPress={requestAudioStreaming}
            />
          </>
        )}
      </View>

      {!isBluetoothAvailable() && (
        <View style={styles.settingsButton}>
          <Button
            title="Open Settings"
            onPress={() => Linking.openSettings()}
          />
        </View>
      )}

      {isScanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="small" color="#0000ff" />
          <Text style={styles.scanningText}>Scanning for devices…</Text>
        </View>
      )}

      <FlatList
        data={devices}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deviceItem}
            onPress={() => connectToDevice(item.id)}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceId}>{item.id}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isScanning
              ? "Finding devices…"
              : "No devices found. Tap Scan to search for nearby devices."}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: "#e6f7ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#91d5ff",
  },
  infoText: {
    color: "#0050b3",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  settingsButton: {
    marginBottom: 16,
  },
  scanningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  scanningText: {
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: "white",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deviceId: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 24,
    color: "#666",
  },
  errorText: {
    color: "red",
    marginBottom: 12,
    fontSize: 14,
  },
});
