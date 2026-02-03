import React from 'react';
import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import tw from 'twrnc';
import type { DiscountedProduct } from '../services/api/productApi';
import { formatPrice, formatSold } from '../utils/formatters';

const { width: screenWidth } = Dimensions.get('window');
const productCardWidth = (screenWidth - 48) / 2;

interface GridProductCardProps {
    item: DiscountedProduct;
    onPress: () => void;
}

const GridProductCard: React.FC<GridProductCardProps> = ({ item, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{ width: productCardWidth }}
    >
        <Surface style={tw`m-1.5 rounded-2xl overflow-hidden bg-white`} elevation={3}>
            {/* Image */}
            <View style={tw`relative`}>
                <View style={tw`h-36 bg-gray-100`}>
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={tw`w-full h-full`}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={tw`flex-1 items-center justify-center`}>
                            <IconButton icon="image-off" size={32} iconColor="#d1d5db" />
                        </View>
                    )}
                </View>

                {/* Discount Badge - Prominent */}
                <View
                    style={tw`absolute top-0 left-0 bg-red-500 px-3 py-1.5 rounded-br-xl`}
                >
                    <Text style={tw`text-sm font-extrabold text-white`}>
                        -{item.discountPercent}%
                    </Text>
                </View>

                {/* Rating */}
                <View
                    style={tw`absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded-full flex-row items-center shadow-sm`}
                >
                    <IconButton icon="star" size={12} iconColor="#f59e0b" style={tw`m-0 p-0`} />
                    <Text style={tw`text-xs text-gray-700 ml-0.5 font-semibold`}>
                        {item.rating.toFixed(1)}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <View style={tw`p-3`}>
                <Text style={tw`text-sm font-semibold text-gray-800 h-10`} numberOfLines={2}>
                    {item.name}
                </Text>

                <View style={tw`mt-1`}>
                    <Text style={tw`text-lg font-extrabold text-red-600`}>
                        {formatPrice(item.price)}
                    </Text>
                    <View style={tw`flex-row items-center justify-between`}>
                        <Text style={tw`text-xs text-gray-400 line-through`}>
                            {item.originalPrice ? formatPrice(item.originalPrice) : ''}
                        </Text>
                        <Text style={tw`text-[10px] text-gray-500`}>
                            {formatSold(item.sold)}
                        </Text>
                    </View>
                </View>
            </View>
        </Surface>
    </TouchableOpacity>
);

export default GridProductCard;
