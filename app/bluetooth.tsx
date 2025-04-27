import { Stack } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import BluetoothDevices from "./components/BluetoothDevices";

export default function BluetoothScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "Bluetooth Devices",
          headerBackTitle: "Back",
        }}
      />
      <BluetoothDevices />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
