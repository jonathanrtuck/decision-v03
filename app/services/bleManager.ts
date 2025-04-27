import {
  BleManager as BleManagerPlx,
  Device,
  BleError,
  Characteristic,
  Subscription,
} from "react-native-ble-plx";
import { Platform, NativeModules } from "react-native";
import { transcribeAudio } from "./transcriptionService";
import * as FileSystem from "expo-file-system";

class BleManager {
  private manager: BleManagerPlx | null;
  private devices: Device[];
  private connectedDevice: Device | null;
  private isScanning: boolean;
  private listeners: Subscription[];
  private connectionStatus: string;
  private isConnected: boolean;
  private heartbeatInterval: NodeJS.Timeout | null;
  private _audioBuffer: Uint8Array[] | null;

  public onStatusChanged: (() => void) | null;

  constructor() {
    // Initialize with null, will be created in init()
    this.manager = null;
    this.devices = [];
    this.connectedDevice = null;
    this.isScanning = false;
    this.listeners = [];
    this.connectionStatus = "Not connected";
    this.isConnected = false;
    this.onStatusChanged = null;
    this.heartbeatInterval = null;
    this._audioBuffer = null;
  }

  // Initialize BLE manager
  public async init(): Promise<boolean> {
    try {
      // Create BleManagerPlx instance here instead of in constructor
      this.manager = new BleManagerPlx();

      // Check permissions on Android
      if (Platform.OS === "android") {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error("Bluetooth permissions not granted");
        }
      }

      // Create event listeners
      this.setupEventListeners();

      return true;
    } catch (error) {
      console.error("Error initializing BLE manager:", error);
      return false;
    }
  }

  // Request necessary permissions for BLE on Android
  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return true;

    if (Platform.Version >= 31) {
      // Android 12+
      const permissionsAndroid = NativeModules.PermissionsAndroid.PERMISSIONS;
      const permissions = [
        permissionsAndroid.BLUETOOTH_SCAN,
        permissionsAndroid.BLUETOOTH_CONNECT,
        permissionsAndroid.ACCESS_FINE_LOCATION,
      ];

      const granted = await NativeModules.PermissionsAndroid.requestMultiple(
        permissions
      );

      return (
        granted[permissionsAndroid.BLUETOOTH_SCAN] === "granted" &&
        granted[permissionsAndroid.BLUETOOTH_CONNECT] === "granted" &&
        granted[permissionsAndroid.ACCESS_FINE_LOCATION] === "granted"
      );
    } else {
      const granted = await NativeModules.PermissionsAndroid.request(
        NativeModules.PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      return granted === "granted";
    }
  }

  // Set up event listeners for BLE state changes
  private setupEventListeners(): void {
    if (!this.manager) return;

    // Add event listener for state changes
    this.listeners.push(
      this.manager.onStateChange((state) => {
        if (state === "PoweredOn") {
          console.log("BLE is powered on");
        } else {
          this.stopScan();
          this.disconnectDevice();
          this.connectionStatus = `Bluetooth is ${state}`;
          this.onStatusChanged?.();
        }
      }, true)
    );
  }

  // Start scanning for BLE devices
  public startScan(): void {
    if (this.isScanning || !this.manager) return;

    this.isScanning = true;
    this.devices = [];

    // Start scanning with timeout
    this.manager.startDeviceScan(
      null,
      null,
      (error: BleError | null, device: Device | null) => {
        if (error) {
          console.error("Error scanning:", error);
          this.isScanning = false;
          return;
        }

        // Add device if not already in the list
        if (device?.name && !this.devices.some((d) => d.id === device.id)) {
          this.devices.push(device);
          this.onStatusChanged?.();
        }
      }
    );

    // Auto-stop scan after 10 seconds
    setTimeout(() => {
      this.stopScan();
    }, 10000);
  }

  // Stop scanning for devices
  public stopScan(): void {
    if (!this.isScanning || !this.manager) return;

    this.manager.stopDeviceScan();
    this.isScanning = false;
  }

  // Connect to a device
  public async connectToDevice(deviceId: string): Promise<boolean> {
    if (!this.manager) return false;

    try {
      this.connectionStatus = "Connecting…";
      this.onStatusChanged?.();

      // Connect to device
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevice = device;
      this.isConnected = true;
      this.connectionStatus = `Connected to ${device.name}`;
      this.onStatusChanged?.();

      // Start heartbeat to maintain connection
      this.startHeartbeat();

      // Add disconnect listener
      this.listeners.push(
        device.onDisconnected(
          (error: BleError | null, disconnectedDevice: Device | null) => {
            this.isConnected = false;
            this.connectionStatus = "Disconnected";
            this.connectedDevice = null;
            this.stopHeartbeat();
            this.onStatusChanged?.();
          }
        )
      );

      return true;
    } catch (error) {
      console.error("Error connecting:", error);
      this.connectionStatus = "Connection failed";
      this.onStatusChanged?.();
      return false;
    }
  }

  // Disconnect from current device
  public async disconnectDevice(): Promise<void> {
    if (!this.connectedDevice) return;

    try {
      await this.connectedDevice.cancelConnection();
      this.stopHeartbeat();
    } catch (error) {
      console.error("Error disconnecting:", error);
    }

    this.connectedDevice = null;
    this.isConnected = false;
    this.connectionStatus = "Disconnected";
    this.onStatusChanged?.();
  }

  // Start heartbeat to maintain connection
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(async () => {
      if (this.connectedDevice) {
        try {
          // Read a characteristic to keep connection alive
          // Replace with your device's service and characteristic UUIDs
          const SERVICE_UUID = "YOUR_SERVICE_UUID";
          const CHAR_UUID = "YOUR_CHARACTERISTIC_UUID";

          await this.connectedDevice.readCharacteristicForService(
            SERVICE_UUID,
            CHAR_UUID
          );
        } catch (error) {
          // Silent handling of heartbeat errors
        }
      }
    }, 5000);
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Request audio streaming from the connected device
  public async requestAudioStreaming(): Promise<boolean> {
    if (!this.connectedDevice) return false;

    try {
      // Implementation depends on your device protocol
      // This is a placeholder for the actual implementation
      const SERVICE_UUID = "YOUR_SERVICE_UUID";
      const AUDIO_CONTROL_CHAR_UUID = "YOUR_AUDIO_CONTROL_CHAR_UUID";

      // Send command to start audio streaming (device-specific)
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        AUDIO_CONTROL_CHAR_UUID,
        Buffer.from([0x01]).toString("base64") // Start audio command
      );

      // Listen for audio data
      this.setupAudioListener();

      return true;
    } catch (error) {
      console.error("Error starting audio streaming:", error);
      return false;
    }
  }

  // Set up listener for audio data
  private setupAudioListener(): void {
    if (!this.connectedDevice) return;

    // Replace with your device's service and characteristic UUIDs
    const SERVICE_UUID = "YOUR_SERVICE_UUID";
    const AUDIO_DATA_CHAR_UUID = "YOUR_AUDIO_DATA_CHAR_UUID";

    // Monitor the characteristic for audio data
    this.listeners.push(
      this.connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        AUDIO_DATA_CHAR_UUID,
        (error: BleError | null, characteristic: Characteristic | null) => {
          if (error) {
            console.error("Error monitoring audio:", error);
            return;
          }

          if (characteristic?.value) {
            // Process audio data
            const audioData = Buffer.from(characteristic.value, "base64");
            this.processAudioData(audioData);
          }
        }
      )
    );
  }

  // Process received audio data
  private async processAudioData(audioData: Buffer): Promise<void> {
    try {
      // In a real implementation, you'd buffer audio data
      // and process it when you have enough for a meaningful chunk

      // Buffer to store incoming audio data
      if (!this._audioBuffer) {
        this._audioBuffer = [];
      }

      // Add new audio data to buffer
      this._audioBuffer.push(new Uint8Array(audioData));

      // Check if we have enough audio data to process
      // This threshold would depend on your specific device and use case
      const bufferThresholdBytes = 16000; // Example: ~1 second of 16kHz mono audio

      if (this._getBufferSize() >= bufferThresholdBytes) {
        // Combine audio chunks
        const combinedAudio = this._combineAudioChunks();

        // Reset buffer after processing
        this._audioBuffer = [];

        // Save the audio data to a temporary file
        const tempFilePath = await this._saveAudioToTempFile(combinedAudio);

        if (tempFilePath) {
          // Use existing transcription service
          const transcription = await transcribeAudio(tempFilePath);

          // Log the transcription result
          console.log("BLE Audio Transcription:", transcription);

          // Here you can dispatch an event or update state with the transcription
          // depending on how your app handles transcriptions

          // Example: dispatch custom event
          // For TypeScript, use a safer approach since document may not be available in React Native
          // Alternatively, you can use a callback function passed by the consuming component
          if (typeof document !== "undefined") {
            const event = new CustomEvent("ble-transcription", {
              detail: { text: transcription },
            });
            document.dispatchEvent(event);
          }
        }
      }
    } catch (error) {
      console.error("Error processing BLE audio data:", error);
    }
  }

  // Get total size of buffered audio data
  private _getBufferSize(): number {
    if (!this._audioBuffer || this._audioBuffer.length === 0) {
      return 0;
    }

    return this._audioBuffer.reduce((size, chunk) => size + chunk.length, 0);
  }

  // Combine audio chunks into a single buffer
  private _combineAudioChunks(): Uint8Array {
    const totalLength = this._getBufferSize();
    const result = new Uint8Array(totalLength);

    let offset = 0;
    if (this._audioBuffer) {
      for (const chunk of this._audioBuffer) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
    }

    return result;
  }

  // Save audio data to a temporary file for transcription
  private async _saveAudioToTempFile(
    audioData: Uint8Array
  ): Promise<string | null> {
    try {
      // Create a unique filename
      const tempFilePath = `${
        FileSystem.cacheDirectory
      }ble_audio_${Date.now()}.wav`;

      // Convert Uint8Array to base64
      const base64Data = Buffer.from(audioData).toString("base64");

      // Write to file
      await FileSystem.writeAsStringAsync(tempFilePath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return tempFilePath;
    } catch (error) {
      console.error("Error saving audio to file:", error);
      return null;
    }
  }

  // Clean up resources
  public dispose(): void {
    this.stopScan();
    this.disconnectDevice();
    this.stopHeartbeat();

    // Remove all listeners
    this.listeners.forEach((listener) => listener.remove());
    this.listeners = [];

    // Destroy manager
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
  }

  // Get list of discovered devices
  public getDevices(): Device[] {
    return this.devices;
  }

  // Get connection status
  public getConnectionStatus(): string {
    return this.connectionStatus;
  }

  // Get scanning status
  public getIsScanning(): boolean {
    return this.isScanning;
  }

  // Get connection status
  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let instance: BleManager | null = null;

export default {
  getInstance: (): BleManager => {
    if (!instance) {
      instance = new BleManager();
    }
    return instance;
  },
};
