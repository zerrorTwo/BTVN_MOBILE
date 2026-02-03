import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import tw from 'twrnc';
import type { ProductListItem } from '../services/api/productApi';
import { formatPrice, formatSold } from '../utils/formatters';

interface HorizontalProductCardProps {
    item: ProductListItem;
    onPress: () => void;
}

const HorizontalProductCard: React.FC<HorizontalProductCardProps> = ({
    item,
    onPress,
}) => {
    const discountPercent =
        item.originalPrice && item.originalPrice > item.price
            ? Math.round(
                ((item.originalPrice - item.price) / item.originalPrice) * 100
            )
            : 0;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
            <Surface style={tw`mx-2 rounded-2xl overflow-hidden bg-white w-40`} elevation={3}>
                {/* Image */}
                <View style={tw`relative`}>
                    <View style={tw`h-32 bg-gray-100`}>
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

                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                        <View
                            style={tw`absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded-full`}
                        >
                            <Text style={tw`text-[10px] font-bold text-white`}>
                                -{discountPercent}%
                            </Text>
                        </View>
                    )}

                    {/* Rating Badge */}
                    <View
                        style={tw`absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded-full flex-row items-center`}
                    >
                        <IconButton icon="star" size={10} iconColor="#fbbf24" style={tw`m-0 p-0`} />
                        <Text style={tw`text-[10px] text-white ml-0.5 font-medium`}>
                            {item.rating.toFixed(1)}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <View style={tw`p-3`}>
                    <Text style={tw`text-sm font-semibold text-gray-800`} numberOfLines={2}>
                        {item.name}
                    </Text>

                    <View style={tw`mt-2`}>
                        <Text style={tw`text-base font-bold text-red-600`}>
                            {formatPrice(item.price)}
                        </Text>
                        {item.originalPrice && item.originalPrice > item.price && (
                            <Text style={tw`text-xs text-gray-400 line-through`}>
                                {formatPrice(item.originalPrice)}
                            </Text>
                        )}
                    </View>

                    <View style={tw`flex-row items-center mt-2`}>
                        <IconButton icon="fire" size={12} iconColor="#f97316" style={tw`m-0 p-0`} />
                        <Text style={tw`text-[10px] text-gray-500 ml-1`}>
                            {formatSold(item.sold)}
                        </Text>
                    </View>
                </View>
            </Surface>
        </TouchableOpacity>
    );
};

export default HorizontalProductCard;
