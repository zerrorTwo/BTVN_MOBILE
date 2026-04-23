import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import tw from 'twrnc';
import type { ProductListItem } from '../services/api/productApi';
import { formatPrice, formatSold } from '../utils/formatters';
import { getProductImage } from '../utils/image';

interface HorizontalProductCardProps {
    item: ProductListItem;
    onPress: () => void;
    onAddToCart?: (item: ProductListItem, start: { x: number; y: number; image?: string | null }) => void;
}

const HorizontalProductCard: React.FC<HorizontalProductCardProps> = ({
    item,
    onPress,
    onAddToCart,
}) => {
    const discountPercent =
        item.originalPrice && item.originalPrice > item.price
            ? Math.round(
                ((item.originalPrice - item.price) / item.originalPrice) * 100
            )
            : 0;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
            <Surface style={tw`mx-2 my-2 rounded-2xl max-h-64 min-h-64 bg-white w-40`} elevation={3}>
                <View style={tw`flex-1 overflow-hidden rounded-2xl`}>
                    {/* Image */}
                    <View style={tw`relative `}>
                        <View style={tw`h-32  bg-gray-100`}>
                            <Image
                                source={{ uri: getProductImage(item.image) }}
                                style={tw`w-full h-full`}
                                resizeMode="cover"
                            />
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
                    <View style={tw`p-3 relative flex-1`}>
                        <Text style={tw`text-sm font-semibold text-gray-800 pr-12`} numberOfLines={2}>
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

                        {/* Sold info - Fixed at bottom-right */}
                        <View style={tw`absolute bottom-0 left-0 flex-row items-center`}>
                            <IconButton icon="fire" size={12} iconColor="#f97316" style={tw`m-0 p-0`} />
                            <Text style={tw`text-[10px] text-gray-500`}>
                                {formatSold(item.sold)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={tw`absolute bottom-0 right-0 bg-orange-50 rounded-full`}
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
            </Surface>
        </TouchableOpacity>
    );
};

export default HorizontalProductCard;
