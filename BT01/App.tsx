import { StatusBar } from "expo-status-bar";
import { useState, useRef, useEffect } from "react";
import { View, Animated } from "react-native";
import IntroScreen from "./src/screens/IntroScreen";
import HomeScreen from "./src/screens/HomeScreen";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'intro' | 'home'>("intro");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentScreen === "home") {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    }
  }, [currentScreen]);

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === "intro" ? (
        <IntroScreen onFinish={() => setCurrentScreen("home")} />
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <HomeScreen />
        </Animated.View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}
