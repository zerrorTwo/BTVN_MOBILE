import React from "react";
import { View, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView, MotiText } from "moti";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { colors, gradients } from "../theme";

const { width } = Dimensions.get("window");

export default function AppSplashScreen() {
    return (
        <LinearGradient
            colors={gradients.splash as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`flex-1 items-center justify-center`}
        >
            {/* Decorative orbs */}
            <MotiView
                from={{ scale: 0.7, opacity: 0.2 }}
                animate={{ scale: 1.1, opacity: 0.35 }}
                transition={{ type: "timing", duration: 2200, loop: true, repeatReverse: true }}
                style={{
                    position: "absolute",
                    width: width * 0.9,
                    height: width * 0.9,
                    borderRadius: width,
                    backgroundColor: colors.primary.light,
                    opacity: 0.25,
                }}
            />
            <MotiView
                from={{ scale: 0.5, opacity: 0.1 }}
                animate={{ scale: 1.0, opacity: 0.25 }}
                transition={{ type: "timing", duration: 1800, loop: true, repeatReverse: true, delay: 200 }}
                style={{
                    position: "absolute",
                    width: width * 0.5,
                    height: width * 0.5,
                    borderRadius: width,
                    backgroundColor: "#fff",
                    opacity: 0.15,
                }}
            />

            {/* Logo mark */}
            <MotiView
                from={{ opacity: 0, translateY: 10, scale: 0.9 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: "spring", damping: 14 }}
                style={tw`w-24 h-24 rounded-3xl bg-white items-center justify-center mb-6`}
            >
                <Ionicons name="bag-handle" size={44} color={colors.primary.main} />
            </MotiView>

            {/* App name */}
            <MotiText
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 450, delay: 150 }}
                style={tw`text-white text-3xl font-bold tracking-wide`}
            >
                DDNC Store
            </MotiText>

            <MotiText
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 450, delay: 350 }}
                style={tw`text-white text-sm mt-2 text-center opacity-80`}
            >
                Mua sắm thông minh cho mọi nhà
            </MotiText>

            {/* Dotted loader */}
            <View style={tw`flex-row mt-10`}>
                {[0, 1, 2].map((i) => (
                    <MotiView
                        key={i}
                        from={{ opacity: 0.3, translateY: 0 }}
                        animate={{ opacity: 1, translateY: -6 }}
                        transition={{
                            type: "timing",
                            duration: 500,
                            loop: true,
                            repeatReverse: true,
                            delay: i * 150,
                        }}
                        style={tw`w-2 h-2 rounded-full bg-white mx-1`}
                    />
                ))}
            </View>
        </LinearGradient>
    );
}
