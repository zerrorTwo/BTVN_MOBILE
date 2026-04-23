import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Avatar, IconButton, Button } from 'react-native-paper';
import tw from 'twrnc';
import { getInitials } from '../utils/formatters';

interface HomeHeaderProps {
    userName: string;
    isAuthenticated: boolean;
    onNotificationPress?: () => void;
    onProfilePress?: () => void;
    onSearchPress?: () => void;
    onLoginPress?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
    userName,
    isAuthenticated,
    onNotificationPress,
    onProfilePress,
    onSearchPress,
    onLoginPress,
}) => (
    <View style={tw`bg-[#0059c9] pt-6 pb-12 px-5`}>
        <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-1`}>
                <Text style={tw`text-blue-100 text-sm font-medium uppercase tracking-wider`}>
                    Xin chào 👋
                </Text>
                <Text style={tw`text-white text-2xl font-bold mt-1`}>
                    {isAuthenticated ? userName : 'Khách'}
                </Text>
            </View>
            {isAuthenticated ? (
                <View style={tw`flex-row items-center`}>
                    <TouchableOpacity
                        style={tw`bg-white/20 p-2 rounded-full mr-2`}
                        onPress={onNotificationPress}
                    >
                        <IconButton
                            icon="bell-outline"
                            size={22}
                            iconColor="#fff"
                            style={tw`m-0`}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onProfilePress}>
                        <Avatar.Text
                            size={48}
                            label={getInitials(userName)}
                            style={tw`bg-white`}
                            labelStyle={tw`text-[#0B5ED7] font-bold text-lg`}
                        />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={tw`bg-white px-5 py-2.5 rounded-full`}
                    onPress={onLoginPress}
                >
                    <Text style={tw`text-[#003b8f] font-bold text-sm`}>Đăng nhập</Text>
                </TouchableOpacity>
            )}
        </View>

        <TouchableOpacity
            style={tw`mt-5 bg-white rounded-2xl px-4 py-3.5 flex-row items-center shadow-lg`}
            onPress={onSearchPress}
            activeOpacity={0.9}
        >
            <IconButton
                icon="magnify"
                size={22}
                iconColor="#9ca3af"
                style={tw`m-0 p-0`}
            />
            <Text style={tw`text-gray-400 ml-2 flex-1`}>
                Tìm kiếm sản phẩm, danh mục...
            </Text>
            <View style={tw`h-8 w-px bg-gray-200 mx-2`} />
            <IconButton
                icon="microphone-outline"
                size={20}
                iconColor="#0059c9"
                style={tw`m-0 p-0`}
            />
        </TouchableOpacity>
    </View>
);

export default HomeHeader;
