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
  Platform,
} from "react-native";
import { Device } from "react-native-ble-plx";
import BleManager from "../services/bleManager";

// Define a safer version of the component with error handling
export default function BluetoothDevicesSafe() {
  const [hasError, setHasError] = useState(false);

  // Error boundary implementation
  if (hasError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bluetooth Devices</Text>
        <Text style={styles.errorText}>
          Something went wrong with the Bluetooth functionality.
        </Text>
        <View style={styles.buttonContainer}>
          <Button title="Try Again" onPress={() => setHasError(false)} />
        </View>
      </View>
    );
  }

  try {
    return <BluetoothDevicesInner onError={() => setHasError(true)} />;
  } catch (error) {
    console.error("Error rendering Bluetooth component:", error);
    setHasError(true);
    return null;
  }
}

// Inner component with the actual functionality
function BluetoothDevicesInner({ onError }: { onError: () => void }) {
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Not connected");
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [manager, setManager] = useState<any>(null);

  // Safer function to handle status changes
  const handleStatusChanged = () => {
    try {
      console.log("Status changed callback triggered");
      if (!manager) return;

      setDevices(manager.getDevices() || []);
      setConnectionStatus(manager.getConnectionStatus() || "Not connected");
      setIsScanning(manager.getIsScanning() || false);
    } catch (error) {
      console.error("Error in status changed handler:", error);
      setError("Error updating status");
    }
  };

  // Safer version of startScan
  const startScan = () => {
    try {
      if (!isInitialized || !manager) {
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
      manager.startScan();
    } catch (error) {
      console.error("Error starting scan:", error);
      setError("Failed to start scan");
      setIsScanning(false);
    }
  };

  // Safer stopScan
  const stopScan = () => {
    try {
      console.log("Stopping scan...");
      if (manager) {
        manager.stopScan();
      }
      setIsScanning(false);
    } catch (error) {
      console.error("Error stopping scan:", error);
      setIsScanning(false);
    }
  };

  // Safer connectToDevice
  const connectToDevice = async (deviceId: string) => {
    try {
      console.log("Connecting to device:", deviceId);
      if (!manager) return;

      await manager.connectToDevice(deviceId);
    } catch (error) {
      console.error("Error connecting to device:", error);
      setError("Failed to connect to device");
    }
  };

  // Safer disconnectDevice
  const disconnectDevice = async () => {
    try {
      console.log("Disconnecting device");
      if (!manager) return;

      await manager.disconnectDevice();
    } catch (error) {
      console.error("Error disconnecting device:", error);
      setError("Failed to disconnect device");
    }
  };

  // Safer requestAudioStreaming
  const requestAudioStreaming = async () => {
    try {
      console.log("Requesting audio streaming");
      if (!manager) return;

      const success = await manager.requestAudioStreaming();
      if (!success) {
        setError("Failed to start audio streaming");
      }
    } catch (error) {
      console.error("Error requesting audio streaming:", error);
      setError("Error starting audio streaming");
    }
  };

  // Safer isBluetoothAvailable
  const isBluetoothAvailable = () => {
    try {
      return (
        connectionStatus.includes("Ready") ||
        connectionStatus.includes("Connected") ||
        (!connectionStatus.includes("Unknown") &&
          !connectionStatus.includes("Unsupported") &&
          !connectionStatus.includes("Unauthorized") &&
          !connectionStatus.includes("PoweredOff") &&
          !connectionStatus.includes("Resetting"))
      );
    } catch (error) {
      console.error("Error checking Bluetooth availability:", error);
      return false;
    }
  };

  // Initialize manager with error handling
  useEffect(() => {
    const initBle = async () => {
      try {
        console.log("Initializing BLE manager");
        setError(null);

        // Check if we're on an iOS simulator (which doesn't support BLE)
        const isIosSimulator =
          Platform.OS === "ios" &&
          Platform.isPad === false &&
          !Platform.isTV &&
          !/\(MacIntel\)/i.test(navigator?.userAgent);

        if (isIosSimulator) {
          console.log(
            "Running on iOS simulator - BLE may not be fully supported"
          );
          setError("Bluetooth may not work in simulator");
          // Continue anyway to display UI
        }

        // Get manager safely
        let bleManagerInstance = null;
        try {
          bleManagerInstance = BleManager.getInstance();
          setManager(bleManagerInstance);
        } catch (error) {
          console.error("Error getting BLE manager instance:", error);
          setError("Failed to initialize Bluetooth manager");
          return;
        }

        if (!bleManagerInstance) {
          setError("Could not create Bluetooth manager");
          return;
        }

        // Initialize safely
        let initialized = false;
        try {
          initialized = await bleManagerInstance.init();
          console.log("BLE initialization result:", initialized);
        } catch (initError) {
          console.error("Error in BLE init:", initError);
          setError("Bluetooth initialization failed");
          return;
        }

        if (!initialized) {
          setError("Failed to initialize Bluetooth");
          return;
        }

        setIsInitialized(true);

        // Set callback safely
        try {
          bleManagerInstance.onStatusChanged = handleStatusChanged;
          handleStatusChanged(); // Initial update
        } catch (callbackError) {
          console.error("Error setting up status callback:", callbackError);
        }
      } catch (error) {
        console.error("Failed to initialize BLE:", error);
        setError(
          "Failed to initialize Bluetooth: " +
            (error instanceof Error ? error.message : String(error))
        );
        onError(); // Notify parent of critical error
      }
    };

    initBle().catch((err) => {
      console.error("Unhandled error in initBle:", err);
      setError("Unhandled error in Bluetooth initialization");
    });

    return () => {
      try {
        console.log("Cleaning up BLE manager");
        if (manager) {
          manager.dispose();
        }
      } catch (error) {
        console.error("Error disposing BLE manager:", error);
      }
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
        data={devices || []}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deviceItem}
            onPress={() => connectToDevice(item.id)}>
            <Text style={styles.deviceName}>
              {item.name || "Unknown Device"}
            </Text>
            <Text style={styles.deviceId}>{item.id || "No ID"}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id || Math.random().toString()}
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
