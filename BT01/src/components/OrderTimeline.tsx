import React, { memo, useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import tw from "twrnc";
import { OrderStatus } from "../types/order.types";
import { colors } from "../theme";

interface OrderTimelineProps {
    currentStatus: OrderStatus;
    createdAt: string;
}

interface TimelineStep {
    status: OrderStatus;
    label: string;
    icon: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
    { status: OrderStatus.PENDING, label: "Đơn hàng mới", icon: "document-text" },
    { status: OrderStatus.CONFIRMED, label: "Đã xác nhận", icon: "checkmark-circle" },
    { status: OrderStatus.PREPARING, label: "Đang chuẩn bị", icon: "cube" },
    { status: OrderStatus.SHIPPING, label: "Đang giao hàng", icon: "bicycle" },
    { status: OrderStatus.COMPLETED, label: "Hoàn thành", icon: "checkmark-done-circle" },
];

const OrderTimelineComponent: React.FC<OrderTimelineProps> = ({
    currentStatus,
    createdAt,
}) => {
    const currentIndex = useMemo(
        () => TIMELINE_STEPS.findIndex((step) => step.status === currentStatus),
        [currentStatus],
    );

    const formattedDate = useMemo(
        () => new Date(createdAt).toLocaleString("vi-VN"),
        [createdAt],
    );

    const isCancelled = useMemo(
        () =>
            currentStatus === OrderStatus.CANCELLED ||
            currentStatus === OrderStatus.CANCEL_REQUESTED,
        [currentStatus],
    );

    if (isCancelled) {
        return (
            <MotiView
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 300 }}
                style={[
                    tw`p-4 rounded-2xl mb-4 flex-row items-center`,
                    { backgroundColor: "#FDE8E7" },
                ]}
            >
                <View
                    style={[
                        tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                        { backgroundColor: colors.error.main },
                    ]}
                >
                    <Ionicons name="close" size={22} color="#fff" />
                </View>
                <View style={tw`flex-1`}>
                    <Text
                        style={[tw`text-base font-semibold`, { color: colors.error.dark }]}
                    >
                        {currentStatus === OrderStatus.CANCELLED
                            ? "Đơn hàng đã hủy"
                            : "Đang chờ xác nhận hủy"}
                    </Text>
                    <Text style={[tw`text-xs mt-1`, { color: colors.error.main }]}>
                        {formattedDate}
                    </Text>
                </View>
            </MotiView>
        );
    }

    return (
        <View
            style={[
                tw`p-4 rounded-2xl mb-4`,
                { backgroundColor: colors.background.paper },
            ]}
        >
            {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index <= currentIndex;
                const isActive = index === currentIndex;

                return (
                    <MotiView
                        key={step.status}
                        from={{ opacity: 0, translateX: -12 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={{ type: "timing", duration: 260, delay: index * 60 }}
                    >
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`relative`}>
                                <View
                                    style={[
                                        tw`w-10 h-10 rounded-full items-center justify-center`,
                                        {
                                            backgroundColor: isCompleted
                                                ? colors.success.main
                                                : colors.border.light,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={step.icon as any}
                                        size={20}
                                        color={isCompleted ? "#fff" : colors.text.hint}
                                    />
                                </View>
                                {isActive && (
                                    <MotiView
                                        from={{ scale: 0.6, opacity: 0.6 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{
                                            type: "timing",
                                            duration: 1200,
                                            loop: true,
                                        }}
                                        style={[
                                            tw`absolute w-10 h-10 rounded-full`,
                                            { backgroundColor: colors.success.main },
                                        ]}
                                    />
                                )}
                            </View>

                            <View style={tw`flex-1 ml-3`}>
                                <Text
                                    style={[
                                        tw`font-semibold`,
                                        {
                                            color: isCompleted
                                                ? colors.text.primary
                                                : colors.text.hint,
                                        },
                                    ]}
                                >
                                    {step.label}
                                </Text>
                                {isActive && (
                                    <Text
                                        style={[tw`text-xs mt-1`, { color: colors.text.secondary }]}
                                    >
                                        {formattedDate}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {index < TIMELINE_STEPS.length - 1 && (
                            <View
                                style={[
                                    tw`w-0.5 h-8 ml-5`,
                                    {
                                        backgroundColor: isCompleted
                                            ? colors.success.main
                                            : colors.border.light,
                                    },
                                ]}
                            />
                        )}
                    </MotiView>
                );
            })}
        </View>
    );
};

export const OrderTimeline = memo(OrderTimelineComponent);
