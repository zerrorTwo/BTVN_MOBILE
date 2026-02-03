import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import tw from 'twrnc';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    icon: string;
    iconColor: string;
    onSeeAll?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    icon,
    iconColor,
    onSeeAll,
}) => (
    <View style={tw`flex-row items-center justify-between px-4 mb-3`}>
        <View style={tw`flex-row items-center flex-1`}>
            <View
                style={[
                    tw`w-10 h-10 rounded-xl items-center justify-center mr-3`,
                    { backgroundColor: `${iconColor}20` },
                ]}
            >
                <IconButton icon={icon} size={20} iconColor={iconColor} style={tw`m-0`} />
            </View>
            <View style={tw`flex-1`}>
                <Text style={tw`text-lg font-bold text-gray-800`}>{title}</Text>
                {subtitle && (
                    <Text style={tw`text-xs text-gray-500`}>{subtitle}</Text>
                )}
            </View>
        </View>
        {onSeeAll && (
            <TouchableOpacity onPress={onSeeAll} style={tw`flex-row items-center`}>
                <Text style={tw`text-sm font-semibold text-indigo-600`}>Xem tất cả</Text>
                <IconButton
                    icon="chevron-right"
                    size={16}
                    iconColor="#4f46e5"
                    style={tw`m-0 p-0`}
                />
            </TouchableOpacity>
        )}
    </View>
);

export default SectionHeader;
