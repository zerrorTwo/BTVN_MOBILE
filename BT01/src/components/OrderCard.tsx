import React, { memo, useMemo, useCallback } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import type { Order, OrderStatus } from "../types/order.types";

interface OrderCardProps {
    order: Order;
    onPress: (orderId: number) => void;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: "#F69113",
    CONFIRMED: "#1E90FF",
    PREPARING: "#9C27B0",
    SHIPPING: "#2196F3",
    COMPLETED: "#26AA99",
    CANCELLED: "#9E9E9E",
    CANCEL_REQUESTED: "#F44336",
};

const STATUS_TEXTS: Record<OrderStatus, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PREPARING: "Đang chuẩn bị",
    SHIPPING: "Đang giao hàng",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    CANCEL_REQUESTED: "Yêu cầu hủy",
};

const OrderCardComponent: React.FC<OrderCardProps> = ({ order, onPress }) => {
    const statusColor = useMemo(() => STATUS_COLORS[order.status] || "#999", [order.status]);
    const statusText = useMemo(() => STATUS_TEXTS[order.status] || order.status, [order.status]);

    const visibleItems = useMemo(() => order.items.slice(0, 3), [order.items]);
    const remainingCount = useMemo(() => order.items.length - 3, [order.items.length]);

    const handlePress = useCallback(() => {
        onPress(order.id);
    }, [order.id, onPress]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={tw`bg-white p-4 mb-3 rounded-lg border border-gray-200`}
            activeOpacity={0.7}
        >
            <View style={tw`flex-row justify-between items-center mb-3`}>
                <Text style={tw`font-semibold text-gray-800`}>{order.orderCode}</Text>
                <View
                    style={[
                        tw`px-3 py-1 rounded-full`,
                        { backgroundColor: `${statusColor}20` },
                    ]}
                >
                    <Text style={[tw`text-xs font-semibold`, { color: statusColor }]}>
                        {statusText}
                    </Text>
                </View>
            </View>

            <View style={tw`flex-row mb-3`}>
                {visibleItems.map((item, index) => (
                    <Image
                        key={`${item.id}-${index}`}
                        source={{
                            uri: item.product.image || "https://via.placeholder.com/60",
                        }}
                        style={tw`w-15 h-15 rounded mr-2`}
                        resizeMode="cover"
                    />
                ))}
                {remainingCount > 0 && (
                    <View style={tw`w-15 h-15 bg-gray-200 rounded justify-center items-center`}>
                        <Text style={tw`text-xs text-gray-600`}>+{remainingCount}</Text>
                    </View>
                )}
            </View>

            <View style={tw`flex-row justify-between items-center pt-3 border-t border-gray-100`}>
                <View>
                    <Text style={tw`text-xs text-gray-500`}>Tổng tiền</Text>
                    <Text style={tw`text-base font-bold text-[#EE4D2D]`}>
                        ₫{order.total.toLocaleString()}
                    </Text>
                </View>
                <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-sm text-gray-600 mr-1`}>Xem chi tiết</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const OrderCard = memo(OrderCardComponent);
