import React, { memo, useMemo, useCallback } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import tw from "twrnc";
import type { Order, OrderStatus } from "../types/order.types";
import { PaymentMethod, PaymentStatus } from "../types/order.types";
import { colors, PAYMENT_METHOD_META } from "../theme";

interface OrderCardProps {
    order: Order;
    onPress: (orderId: number) => void;
    index?: number;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: colors.status.pending,
    CONFIRMED: colors.status.confirmed,
    PREPARING: colors.status.preparing,
    SHIPPING: colors.status.shipping,
    COMPLETED: colors.status.completed,
    CANCELLED: colors.status.cancelled,
    CANCEL_REQUESTED: colors.status.cancelRequested,
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

const OrderCardComponent: React.FC<OrderCardProps> = ({ order, onPress, index = 0 }) => {
    const statusColor = useMemo(
        () => STATUS_COLORS[order.status] || colors.text.secondary,
        [order.status],
    );
    const statusText = useMemo(
        () => STATUS_TEXTS[order.status] || order.status,
        [order.status],
    );

    const paymentMeta = useMemo(
        () => PAYMENT_METHOD_META[order.paymentMethod],
        [order.paymentMethod],
    );
    const isUnpaidOnline =
        order.paymentMethod !== PaymentMethod.COD &&
        order.paymentStatus !== PaymentStatus.PAID &&
        order.paymentStatus !== PaymentStatus.REFUNDED;

    const visibleItems = useMemo(() => order.items.slice(0, 3), [order.items]);
    const remainingCount = useMemo(
        () => order.items.length - 3,
        [order.items.length],
    );

    const handlePress = useCallback(() => {
        onPress(order.id);
    }, [order.id, onPress]);

    return (
        <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 260, delay: index * 40 }}
        >
            <TouchableOpacity
                onPress={handlePress}
                style={[
                    tw`p-4 mb-3 rounded-2xl border`,
                    {
                        backgroundColor: colors.background.paper,
                        borderColor: colors.border.light,
                    },
                ]}
                activeOpacity={0.8}
            >
                {/* Header row */}
                <View style={tw`flex-row justify-between items-center mb-3`}>
                    <View style={tw`flex-row items-center`}>
                        <View
                            style={[
                                tw`w-8 h-8 rounded-lg items-center justify-center mr-2`,
                                { backgroundColor: `${statusColor}1A` },
                            ]}
                        >
                            <Ionicons name="receipt-outline" size={16} color={statusColor} />
                        </View>
                        <Text
                            style={[tw`font-semibold`, { color: colors.text.primary, fontSize: 14 }]}
                        >
                            {order.orderCode}
                        </Text>
                    </View>
                    <View
                        style={[
                            tw`px-3 py-1 rounded-full`,
                            { backgroundColor: `${statusColor}1A` },
                        ]}
                    >
                        <Text style={[tw`text-xs font-semibold`, { color: statusColor }]}>
                            {statusText}
                        </Text>
                    </View>
                </View>

                {/* Product thumbnails */}
                <View style={tw`flex-row mb-3`}>
                    {visibleItems.map((item, i) => (
                        <Image
                            key={`${item.id}-${i}`}
                            source={{
                                uri: item.product.image || "https://via.placeholder.com/60",
                            }}
                            style={tw`w-15 h-15 rounded-lg mr-2`}
                            resizeMode="cover"
                        />
                    ))}
                    {remainingCount > 0 && (
                        <View
                            style={[
                                tw`w-15 h-15 rounded-lg justify-center items-center`,
                                { backgroundColor: colors.background.default },
                            ]}
                        >
                            <Text style={[tw`text-xs`, { color: colors.text.secondary }]}>
                                +{remainingCount}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Payment method chip */}
                <View style={tw`flex-row items-center mb-3`}>
                    <View
                        style={[
                            tw`flex-row items-center px-2 py-1 rounded-lg mr-2`,
                            { backgroundColor: paymentMeta.softBg },
                        ]}
                    >
                        <Ionicons name={paymentMeta.icon as any} size={12} color={paymentMeta.color} />
                        <Text style={[tw`text-xs font-semibold ml-1`, { color: paymentMeta.color }]}>
                            {paymentMeta.shortLabel}
                        </Text>
                    </View>
                    {isUnpaidOnline && (
                        <View
                            style={[
                                tw`px-2 py-1 rounded-lg`,
                                { backgroundColor: "#FFF4E5" },
                            ]}
                        >
                            <Text style={[tw`text-xs font-semibold`, { color: colors.payment.unpaid }]}>
                                Chưa thanh toán
                            </Text>
                        </View>
                    )}
                    {order.paymentStatus === PaymentStatus.PAID && (
                        <View
                            style={[
                                tw`px-2 py-1 rounded-lg`,
                                { backgroundColor: "#E8F7F3" },
                            ]}
                        >
                            <Text style={[tw`text-xs font-semibold`, { color: colors.payment.paid }]}>
                                Đã thanh toán
                            </Text>
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View
                    style={[
                        tw`flex-row justify-between items-center pt-3 border-t`,
                        { borderColor: colors.border.light },
                    ]}
                >
                    <View>
                        <Text style={[tw`text-xs`, { color: colors.text.secondary }]}>
                            Tổng tiền
                        </Text>
                        <Text
                            style={[tw`text-base font-bold`, { color: colors.primary.main }]}
                        >
                            ₫{order.total.toLocaleString()}
                        </Text>
                    </View>
                    <View style={tw`flex-row items-center`}>
                        <Text style={[tw`text-sm mr-1`, { color: colors.text.secondary }]}>
                            Chi tiết
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
                    </View>
                </View>
            </TouchableOpacity>
        </MotiView>
    );
};

export const OrderCard = memo(OrderCardComponent);
