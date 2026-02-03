import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import tw from 'twrnc';
import type { CategoryItem } from '../services/api/productApi';

interface CategoryCardProps {
    item: CategoryItem;
    onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ item, onPress }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Surface
            style={tw`mx-2 rounded-2xl overflow-hidden bg-white`}
            elevation={2}
        >
            <View style={tw`w-20 items-center py-3 px-2`}>
                <View
                    style={tw`w-14 h-14 rounded-xl bg-indigo-50 items-center justify-center mb-2 overflow-hidden`}
                >
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={tw`w-full h-full`}
                            resizeMode="cover"
                        />
                    ) : (
                        <IconButton icon="shape" size={28} iconColor="#6366f1" style={tw`m-0`} />
                    )}
                </View>
                <Text
                    style={tw`text-xs font-semibold text-gray-700 text-center`}
                    numberOfLines={2}
                >
                    {item.name}
                </Text>
                {item.productCount !== undefined && (
                    <Text style={tw`text-[10px] text-gray-400 mt-0.5`}>
                        {item.productCount} SP
                    </Text>
                )}
            </View>
        </Surface>
    </TouchableOpacity>
);

export default CategoryCard;
