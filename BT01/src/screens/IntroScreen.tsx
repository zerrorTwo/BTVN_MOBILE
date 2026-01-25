import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { Button } from "react-native-paper";
import Layout from "../components/Layout";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Intro">;

export default function IntroScreen({ navigation }: Props) {
  return (
    <Layout>
      <View style={styles.container}>
        <Image
          source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }}
          style={styles.logo}
        />
        <Text style={styles.text}>Welcome to BT01</Text>
        <Text style={styles.subText}>You are logged in!</Text>

        <Button
          mode="contained"
          onPress={() => navigation.navigate("Home")}
          style={styles.button}
        >
          Go to Home
        </Button>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: "gray",
    marginBottom: 30,
  },
  button: {
    minWidth: 200,
  },
});
