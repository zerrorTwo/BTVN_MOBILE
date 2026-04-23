import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import tw from "twrnc";
import { colors } from "../theme";

type ToastShape = {
    text1?: string;
    text2?: string;
};

const Base: React.FC<{
    text1?: string;
    text2?: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
    bg: string;
}> = ({ text1, text2, color, icon, bg }) => (
    <MotiView
        from={{ opacity: 0, translateY: -16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 220 }}
        style={[
            tw`flex-row items-center mx-4 px-4 py-3 rounded-xl`,
            {
                backgroundColor: bg,
                borderLeftWidth: 4,
                borderLeftColor: color,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
                elevation: 6,
                minHeight: 56,
            },
        ]}
    >
        <Ionicons name={icon} size={22} color={color} style={tw`mr-3`} />
        <View style={tw`flex-1`}>
            {text1 ? (
                <Text style={[tw`font-semibold text-gray-900`, { fontSize: 14 }]}>{text1}</Text>
            ) : null}
            {text2 ? (
                <Text style={[tw`text-gray-600 mt-0.5`, { fontSize: 12 }]}>{text2}</Text>
            ) : null}
        </View>
    </MotiView>
);

export const toastConfig = {
    success: ({ text1, text2 }: ToastShape) => (
        <Base
            text1={text1}
            text2={text2}
            color={colors.success.main}
            icon="checkmark-circle"
            bg="#ECFDF5"
        />
    ),
    error: ({ text1, text2 }: ToastShape) => (
        <Base
            text1={text1}
            text2={text2}
            color={colors.error.main}
            icon="close-circle"
            bg="#FEF2F2"
        />
    ),
    info: ({ text1, text2 }: ToastShape) => (
        <Base
            text1={text1}
            text2={text2}
            color={colors.info.main}
            icon="information-circle"
            bg="#EFF6FF"
        />
    ),
    warning: ({ text1, text2 }: ToastShape) => (
        <Base
            text1={text1}
            text2={text2}
            color={colors.warning.main}
            icon="warning"
            bg="#FFFBEB"
        />
    ),
};
