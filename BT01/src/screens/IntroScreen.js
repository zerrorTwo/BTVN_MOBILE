import React, { useEffect } from "react";
import { StyleSheet, Text, View, Image } from "react-native";

const IntroScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
        style={styles.logo}
      />
      <Text style={styles.text}>Welcome to BT01</Text>
      <Text style={styles.subText}>Redirecting in 10 seconds...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: "gray",
  },
});

export default IntroScreen;
