import React, { memo } from "react";
import { View, Text } from "react-native";
import tw from "twrnc";
import { Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { colors } from "../theme";

interface EmptyStateProps {
    title: string;
    message: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    buttonText?: string;
    onButtonPress?: () => void;
}

const EmptyStateComponent: React.FC<EmptyStateProps> = ({
    title,
    message,
    iconName = "file-tray-outline",
    iconColor = colors.primary.main,
    buttonText,
    onButtonPress,
}) => {
    return (
        <View style={tw`flex-1 justify-center items-center px-6`}>
            <MotiView
                from={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                style={[
                    tw`w-28 h-28 rounded-full items-center justify-center`,
                    { backgroundColor: `${iconColor}15` },
                ]}
            >
                <Ionicons name={iconName} size={56} color={iconColor} />
            </MotiView>

            <MotiView
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 320, delay: 120 }}
            >
                <Text
                    style={[
                        tw`text-xl font-bold mt-5 text-center`,
                        { color: colors.text.primary },
                    ]}
                >
                    {title}
                </Text>

                <Text
                    style={[
                        tw`text-sm mt-2 text-center`,
                        { color: colors.text.secondary },
                    ]}
                >
                    {message}
                </Text>
            </MotiView>

            {buttonText && onButtonPress && (
                <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 320, delay: 220 }}
                >
                    <Button
                        mode="contained"
                        onPress={onButtonPress}
                        style={tw`mt-6 rounded-xl`}
                        buttonColor={colors.primary.main}
                        labelStyle={tw`text-white font-semibold`}
                        contentStyle={tw`px-4`}
                    >
                        {buttonText}
                    </Button>
                </MotiView>
            )}
        </View>
    );
};

export const EmptyState = memo(EmptyStateComponent);
export default EmptyState;
