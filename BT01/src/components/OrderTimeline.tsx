import React, { memo, useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { OrderStatus } from "../types/order.types";

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
        [currentStatus]
    );

    const formattedDate = useMemo(
        () => new Date(createdAt).toLocaleString("vi-VN"),
        [createdAt]
    );

    const isCancelled = useMemo(
        () => currentStatus === OrderStatus.CANCELLED || currentStatus === OrderStatus.CANCEL_REQUESTED,
        [currentStatus]
    );

    if (isCancelled) {
        return (
            <View style={tw`bg-red-50 p-4 rounded-lg mb-4`}>
                <View style={tw`flex-row items-center`}>
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                    <Text style={tw`text-base font-semibold text-red-600 ml-2`}>
                        {currentStatus === OrderStatus.CANCELLED
                            ? "Đơn hàng đã hủy"
                            : "Đang chờ xác nhận hủy"}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={tw`bg-white p-4 rounded-lg mb-4`}>
            {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index <= currentIndex;
                const isActive = index === currentIndex;

                return (
                    <View key={step.status}>
                        <View style={tw`flex-row items-center`}>
                            <View
                                style={[
                                    tw`w-10 h-10 rounded-full items-center justify-center`,
                                    isCompleted ? tw`bg-[#26AA99]` : tw`bg-gray-200`,
                                ]}
                            >
                                <Ionicons
                                    name={step.icon as any}
                                    size={20}
                                    color={isCompleted ? "#FFF" : "#999"}
                                />
                            </View>

                            <View style={tw`flex-1 ml-3`}>
                                <Text
                                    style={[
                                        tw`font-semibold`,
                                        isCompleted ? tw`text-gray-800` : tw`text-gray-400`,
                                    ]}
                                >
                                    {step.label}
                                </Text>
                                {isActive && (
                                    <Text style={tw`text-xs text-gray-500 mt-1`}>
                                        {formattedDate}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {index < TIMELINE_STEPS.length - 1 && (
                            <View
                                style={[
                                    tw`w-0.5 h-8 ml-5`,
                                    isCompleted ? tw`bg-[#26AA99]` : tw`bg-gray-200`,
                                ]}
                            />
                        )}
                    </View>
                );
            })}
        </View>
    );
};

export const OrderTimeline = memo(OrderTimelineComponent);
