import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import tw from 'twrnc';

export default function AppSplashScreen() {
    return (
        <View style={tw`flex-1 bg-[#0059c9] items-center justify-center px-6`}>
            <Text style={tw`text-white text-3xl font-bold tracking-wide`}>DDNC Store</Text>
            <Text style={tw`text-blue-100 text-sm mt-2 text-center`}>
                Đang tải dữ liệu, vui lòng chờ trong giây lát...
            </Text>
            <ActivityIndicator size="large" color="#93C5FD" style={tw`mt-6`} />
        </View>
    );
}
