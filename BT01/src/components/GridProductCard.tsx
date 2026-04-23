import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import tw from 'twrnc';
import type { DiscountedProduct } from '../services/api/productApi';
import { formatPrice, formatSold } from '../utils/formatters';
import { getProductImage } from '../utils/image';

interface GridProductCardProps {
    item: DiscountedProduct;
    onPress: () => void;
    onAddToCart?: (item: DiscountedProduct, start: { x: number; y: number; image?: string | null }) => void;
}

const GridProductCard: React.FC<GridProductCardProps> = ({ item, onPress, onAddToCart }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={tw`w-[48%]`}
    >
        <Surface style={tw`my-1.5 rounded-2xl bg-white`} elevation={3}>
            <View style={tw`overflow-hidden rounded-2xl`}>
                {/* Image */}
                <View style={tw`relative`}>
                    <View style={tw`h-36 bg-gray-100`}>
                        <Image
                            source={{ uri: getProductImage(item.image) }}
                            style={tw`w-full h-full`}
                            resizeMode="cover"
                        />
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
                        <View style={tw`items-end mt-1`}>
                            <TouchableOpacity
                                style={tw`bg-orange-50 rounded-full`}
                                onPress={(e) =>
                                    onAddToCart?.(item, {
                                        x: e.nativeEvent.pageX,
                                        y: e.nativeEvent.pageY,
                                        image: item.image,
                                    })
                                }
                            >
                                <IconButton icon="cart-plus" size={16} iconColor="#EE4D2D" style={tw`m-0`} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Surface>
    </TouchableOpacity>
);

export default GridProductCard;
