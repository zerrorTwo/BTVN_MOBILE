import React, { memo } from "react";
import { View, Text, Image } from "react-native";
import tw from "twrnc";
import { Button } from "react-native-paper";

interface EmptyStateProps {
    title: string;
    message: string;
    icon?: string;
    buttonText?: string;
    onButtonPress?: () => void;
}

const EmptyStateComponent: React.FC<EmptyStateProps> = ({
    title,
    message,
    icon,
    buttonText,
    onButtonPress,
}) => {
    return (
        <View style={tw`flex-1 justify-center items-center px-6`}>
            {icon && (
                <Image
                    source={{ uri: icon }}
                    style={{ width: 200, height: 200 }}
                    resizeMode="contain"
                />
            )}

            <Text style={tw`text-xl font-bold text-gray-800 mt-4 text-center`}>
                {title}
            </Text>

            <Text style={tw`text-sm text-gray-500 mt-2 text-center`}>
                {message}
            </Text>

            {buttonText && onButtonPress && (
                <Button
                    mode="contained"
                    onPress={onButtonPress}
                    style={tw`mt-6 bg-[#0B5ED7]`}
                    labelStyle={tw`text-white`}
                >
                    {buttonText}
                </Button>
            )}
        </View>
    );
};

export const EmptyState = memo(EmptyStateComponent);
