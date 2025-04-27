import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
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
    setDevices(bleManager.getDevices());
    setConnectionStatus(bleManager.getConnectionStatus());
    setIsScanning(bleManager.getIsScanning());
  };
  const startScan = () => {
    if (!isInitialized) {
      setError("Bluetooth is not initialized yet");
      return;
    }
    setIsScanning(true);
    bleManager.startScan();
  };
  const stopScan = () => {
    bleManager.stopScan();
    setIsScanning(false);
  };
  const connectToDevice = async (deviceId: string) => {
    await bleManager.connectToDevice(deviceId);
  };
  const disconnectDevice = async () => {
    await bleManager.disconnectDevice();
  };
  const requestAudioStreaming = async () => {
    await bleManager.requestAudioStreaming();
  };

  useEffect(() => {
    const initBle = async () => {
      try {
        setError(null);
        const initialized = await bleManager.init();
        if (!initialized) {
          setError("Failed to initialize Bluetooth");
          return;
        }

        setIsInitialized(true);
        bleManager.onStatusChanged = handleStatusChanged;
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
      bleManager.dispose();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Devices</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Text style={styles.status}>Status: {connectionStatus}</Text>
      <View style={styles.buttonContainer}>
        {!isScanning ? (
          <Button
            title="Scan for Devices"
            onPress={startScan}
            disabled={!isInitialized}
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
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
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
