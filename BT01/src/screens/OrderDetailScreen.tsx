import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ActivityIndicator, Snackbar } from "react-native-paper";
import tw from "twrnc";
import { OrderTimeline } from "../components/OrderTimeline";
import {
    useGetOrderByIdQuery,
    useCancelOrderMutation,
} from "../services/api/orderApi";
import { OrderStatus } from "../types/order.types";

export const OrderDetailScreen = ({ route, navigation }: any) => {
    const { orderId } = route.params;
    const { data, isLoading, refetch } = useGetOrderByIdQuery(orderId);
    const [cancelOrder, { isLoading: isCanceling }] = useCancelOrderMutation();

    const [cancellationReason, setCancellationReason] = useState("");
    const [showCancelInput, setShowCancelInput] = useState(false);
    const [snackMessage, setSnackMessage] = useState("");

    const order = data?.data;

    /**
     * canCancel comes from API:
     * - "direct"  : within 30 min → được hủy trực tiếp
     * - "request" : sau 30 min → gửi yêu cầu hủy
     * - "none"    : không được hủy
     */

    const handleCancelOrder = async () => {
        if (!cancellationReason.trim()) {
            setSnackMessage("Vui lòng nhập lý do hủy đơn");
            return;
        }

        try {
            await cancelOrder({
                id: orderId,
                data: { cancellationReason },
            }).unwrap();

            if (order?.canCancel === "request") {
                setSnackMessage("Đã gửi yêu cầu hủy đơn đến shop");
            } else {
                setSnackMessage("Đơn hàng đã được hủy thành công");
            }
            setShowCancelInput(false);
            setCancellationReason("");
            refetch();
        } catch (error: any) {
            setSnackMessage(error.data?.message || "Không thể hủy đơn hàng");
        }
    };

    if (isLoading) {
        return (
            <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
                <ActivityIndicator size="large" color="#0B5ED7" />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
                <Text style={tw`text-gray-600`}>Không tìm thấy đơn hàng</Text>
            </View>
        );
    }

    const isTerminal =
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.CANCEL_REQUESTED ||
        order.status === OrderStatus.COMPLETED;

    const cancelButtonLabel = order.canCancel === "request"
        ? "Gửi yêu cầu hủy đơn"
        : "Hủy đơn hàng";

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["bottom"]}>
            <ScrollView>
                {/* Timeline */}
                <View style={tw`p-4`}>
                    <OrderTimeline currentStatus={order.status} createdAt={order.createdAt} />
                </View>

                {/* Order Info */}
                <View style={tw`bg-white px-4 py-3 mb-2`}>
                    <Text style={tw`text-base font-semibold mb-2`}>Thông tin đơn hàng</Text>
                    <View style={tw`flex-row justify-between py-1`}>
                        <Text style={tw`text-gray-600`}>Mã đơn hàng</Text>
                        <Text style={tw`font-semibold`}>{order.orderCode}</Text>
                    </View>
                    <View style={tw`flex-row justify-between py-1`}>
                        <Text style={tw`text-gray-600`}>Ngày đặt</Text>
                        <Text>{new Date(order.createdAt).toLocaleString("vi-VN")}</Text>
                    </View>
                    <View style={tw`flex-row justify-between py-1`}>
                        <Text style={tw`text-gray-600`}>Thanh toán</Text>
                        <Text>{order.paymentMethod}</Text>
                    </View>
                </View>

                {/* Shipping Info */}
                <View style={tw`bg-white px-4 py-3 mb-2`}>
                    <Text style={tw`text-base font-semibold mb-2`}>Địa chỉ nhận hàng</Text>
                    <Text style={tw`font-semibold`}>{order.receiverName}</Text>
                    <Text style={tw`text-gray-600 mt-1`}>{order.receiverPhone}</Text>
                    <Text style={tw`text-gray-600 mt-1`}>{order.shippingAddress}</Text>
                </View>

                {/* Products */}
                <View style={tw`bg-white px-4 py-3 mb-2`}>
                    <Text style={tw`text-base font-semibold mb-3`}>Sản phẩm</Text>
                    {order.items.map((item, index) => (
                        <View
                            key={index}
                            style={tw`flex-row py-3 ${index > 0 ? "border-t border-gray-100" : ""}`}
                        >
                            <Image
                                source={{
                                    uri: item.product.image || "https://via.placeholder.com/80",
                                }}
                                style={tw`w-20 h-20 rounded`}
                            />
                            <View style={tw`flex-1 ml-3`}>
                                <Text style={tw`text-sm font-semibold`} numberOfLines={2}>
                                    {item.product.name}
                                </Text>
                                <Text style={tw`text-xs text-gray-500 mt-1`}>
                                    x{item.quantity}
                                </Text>
                                <Text style={tw`text-base font-bold text-[#0B5ED7] mt-1`}>
                                    ₫{item.unitPrice.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Price Summary */}
                <View style={tw`bg-white px-4 py-3 mb-2`}>
                    <View style={tw`flex-row justify-between py-2`}>
                        <Text style={tw`text-gray-600`}>Tạm tính</Text>
                        <Text>₫{order.total.toLocaleString()}</Text>
                    </View>
                    <View style={tw`flex-row justify-between py-2`}>
                        <Text style={tw`text-gray-600`}>Giảm giá</Text>
                        <Text>-₫{order.discount.toLocaleString()}</Text>
                    </View>
                    <View style={tw`flex-row justify-between py-2 border-t border-gray-200`}>
                        <Text style={tw`font-semibold`}>Tổng cộng</Text>
                        <Text style={tw`text-xl font-bold text-[#0B5ED7]`}>
                            ₫{order.total.toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Note */}
                {order.note && (
                    <View style={tw`bg-white px-4 py-3 mb-2`}>
                        <Text style={tw`text-base font-semibold mb-2`}>Ghi chú</Text>
                        <Text style={tw`text-gray-600`}>{order.note}</Text>
                    </View>
                )}

                {/* Cancellation Reason */}
                {order.cancellationReason && (
                    <View style={tw`bg-red-50 p-4 mb-2`}>
                        <Text style={tw`text-base font-semibold text-red-800 mb-2`}>
                            Lý do hủy
                        </Text>
                        <Text style={tw`text-gray-700`}>{order.cancellationReason}</Text>
                    </View>
                )}

                {/* Cancel Input */}
                {showCancelInput && (
                    <View style={tw`bg-white px-4 py-3 mb-2`}>
                        <Text style={tw`text-base font-semibold mb-1`}>{cancelButtonLabel}</Text>
                        {order.canCancel === "request" && (
                            <Text style={tw`text-xs text-orange-600 mb-2`}>
                                ⚠️ Đơn hàng đang được chuẩn bị/giao — yêu cầu sẽ được gửi đến shop để xác nhận hủy.
                            </Text>
                        )}
                        <TextInput
                            placeholder="Nhập lý do hủy đơn hàng..."
                            value={cancellationReason}
                            onChangeText={setCancellationReason}
                            multiline
                            numberOfLines={3}
                            style={tw`border border-gray-300 rounded px-3 py-2 mb-3`}
                            textAlignVertical="top"
                        />
                        <View style={tw`flex-row gap-2`}>
                            <Button
                                mode="outlined"
                                onPress={() => {
                                    setShowCancelInput(false);
                                    setCancellationReason("");
                                }}
                                style={tw`flex-1`}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleCancelOrder}
                                loading={isCanceling}
                                style={tw`flex-1 bg-red-600`}
                            >
                                Xác nhận
                            </Button>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Action Buttons */}
            {!showCancelInput && !isTerminal && order.canCancel !== "none" && (
                <View style={tw`bg-white px-4 py-3 border-t border-gray-200`}>
                    <View style={tw`flex-row gap-2 mb-2`}>
                        <Button
                            mode="contained-tonal"
                            onPress={() => navigation.navigate("OrderTracking", { orderId })}
                            style={tw`flex-1`}
                        >
                            Theo dõi đơn
                        </Button>
                    </View>
                    <View style={tw`flex-row gap-2`}>
                        <Button
                            mode="outlined"
                            onPress={() => setShowCancelInput(true)}
                            style={tw`flex-1 border-red-600`}
                            textColor="#DC2626"
                        >
                            {cancelButtonLabel}
                        </Button>
                        {order.status === OrderStatus.COMPLETED && (
                            <Button
                                mode="contained"
                                onPress={() => navigation.navigate("Home")}
                                style={tw`flex-1 bg-[#0B5ED7]`}
                            >
                                Mua lại
                            </Button>
                        )}
                    </View>
                </View>
            )}

            {/* Snackbar */}
            <Snackbar
                visible={!!snackMessage}
                onDismiss={() => setSnackMessage("")}
                duration={2500}
                style={tw`mb-4 bg-gray-800`}
            >
                {snackMessage}
            </Snackbar>
        </SafeAreaView>
    );
};
