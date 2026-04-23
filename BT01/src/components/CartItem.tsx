import React, { useCallback, memo } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import type { CartItem as CartItemType } from "../types/cart.types";

interface CartItemProps {
    item: CartItemType;
    onUpdateQuantity: (itemId: number, quantity: number) => void;
    onRemove: (itemId: number) => void;
}

const CartItemComponent: React.FC<CartItemProps> = ({
    item,
    onUpdateQuantity,
    onRemove,
}) => {
    const handleIncrease = useCallback(() => {
        if (item.quantity < item.product.stock) {
            onUpdateQuantity(item.id, item.quantity + 1);
        }
    }, [item.id, item.quantity, item.product.stock, onUpdateQuantity]);

    const handleDecrease = useCallback(() => {
        if (item.quantity > 1) {
            onUpdateQuantity(item.id, item.quantity - 1);
        }
    }, [item.id, item.quantity, onUpdateQuantity]);

    const handleRemove = useCallback(() => {
        onRemove(item.id);
    }, [item.id, onRemove]);

    const isAtMinQuantity = item.quantity <= 1;
    const isAtMaxQuantity = item.quantity >= item.product.stock;
    const isLowStock = item.product.stock < 10;

    return (
        <View style={tw`bg-white p-4 mb-2 rounded-lg flex-row`}>
            <Image
                source={{
                    uri: item.product.image || "https://via.placeholder.com/80",
                }}
                style={tw`w-20 h-20 rounded-lg`}
                resizeMode="cover"
            />

            <View style={tw`flex-1 ml-3`}>
                <Text style={tw`text-sm font-semibold text-gray-800`} numberOfLines={2}>
                    {item.product.name}
                </Text>

                <Text style={tw`text-base font-bold text-[#0B5ED7] mt-1`}>
                    ₫{item.product.price.toLocaleString()}
                </Text>

                {isLowStock && (
                    <Text style={tw`text-xs text-red-500 mt-1`}>
                        Chỉ còn {item.product.stock} sản phẩm
                    </Text>
                )}

                <View style={tw`flex-row items-center mt-2`}>
                    <TouchableOpacity
                        onPress={handleDecrease}
                        disabled={isAtMinQuantity}
                        style={[
                            tw`border border-gray-300 rounded px-2 py-1`,
                            isAtMinQuantity && tw`opacity-50`,
                        ]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="remove" size={16} color="#555" />
                    </TouchableOpacity>

                    <Text style={tw`mx-3 text-sm font-semibold`}>{item.quantity}</Text>

                    <TouchableOpacity
                        onPress={handleIncrease}
                        disabled={isAtMaxQuantity}
                        style={[
                            tw`border border-gray-300 rounded px-2 py-1`,
                            isAtMaxQuantity && tw`opacity-50`,
                        ]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={16} color="#555" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity onPress={handleRemove} style={tw`ml-2`} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={24} color="#0B5ED7" />
            </TouchableOpacity>
        </View>
    );
};

export const CartItem = memo(CartItemComponent);
