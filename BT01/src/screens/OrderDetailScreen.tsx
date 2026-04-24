import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    TextInput,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Button, Portal, Modal } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Toast from "react-native-toast-message";
import tw from "twrnc";
import { OrderTimeline } from "../components/OrderTimeline";
import { OrderDetailSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import {
    useGetOrderByIdQuery,
    useCancelOrderMutation,
    useInitMomoPaymentMutation,
} from "../services/api/orderApi";
import {
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
} from "../types/order.types";
import { colors, PAYMENT_METHOD_META, PAYMENT_STATUS_META } from "../theme";

export const OrderDetailScreen = ({ route, navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { orderId } = route.params;
    const { data, isLoading, refetch } = useGetOrderByIdQuery(orderId, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [cancelOrder, { isLoading: isCanceling }] = useCancelOrderMutation();
    const [initMomoPayment, { isLoading: isRetryingPayment }] =
        useInitMomoPaymentMutation();

    const [cancellationReason, setCancellationReason] = useState("");
    const [cancelModalVisible, setCancelModalVisible] = useState(false);

    const order = data?.data;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch]),
    );

    const handleRetryMomo = async () => {
        try {
            const result = await initMomoPayment(orderId).unwrap();
            if (result.data?.payUrl) {
                navigation.navigate("PaymentWebView", {
                    orderId,
                    payUrl: result.data.payUrl,
                });
            } else {
                Toast.show({
                    type: "error",
                    text1: "Không lấy được liên kết thanh toán",
                });
            }
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Không thể khởi tạo MoMo",
                text2: error.data?.message,
            });
        }
    };

    const handleCancelOrder = async () => {
        if (!cancellationReason.trim()) {
            Toast.show({ type: "warning", text1: "Vui lòng nhập lý do hủy" });
            return;
        }

        try {
            await cancelOrder({
                id: orderId,
                data: { cancellationReason },
            }).unwrap();

            Toast.show({
                type: "success",
                text1:
                    order?.canCancel === "request"
                        ? "Đã gửi yêu cầu hủy đến shop"
                        : "Đã hủy đơn hàng",
            });
            setCancelModalVisible(false);
            setCancellationReason("");
            refetch();
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Không thể hủy đơn",
                text2: error.data?.message,
            });
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView
                style={[tw`flex-1`, { backgroundColor: colors.background.default }]}
                edges={["bottom"]}
            >
                <OrderDetailSkeleton />
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView
                style={[tw`flex-1`, { backgroundColor: colors.background.default }]}
                edges={["bottom"]}
            >
                <EmptyState
                    iconName="alert-circle-outline"
                    iconColor={colors.error.main}
                    title="Không tìm thấy đơn hàng"
                    message="Đơn hàng này có thể đã bị xóa hoặc không tồn tại"
                    buttonText="Về trang chủ"
                    onButtonPress={() => navigation.navigate("Home")}
                />
            </SafeAreaView>
        );
    }

    const paymentMeta = PAYMENT_METHOD_META[order.paymentMethod];
    const paymentStatusMeta = PAYMENT_STATUS_META[order.paymentStatus];

    const isTerminal =
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.CANCEL_REQUESTED ||
        order.status === OrderStatus.COMPLETED;

    const showRetryMomo =
        order.paymentMethod === PaymentMethod.MOMO &&
        order.paymentStatus !== PaymentStatus.PAID &&
        order.status === OrderStatus.PENDING;

    const cancelButtonLabel =
        order.canCancel === "request"
            ? "Gửi yêu cầu hủy đơn"
            : "Hủy đơn hàng";

    return (
        <SafeAreaView
            style={[tw`flex-1`, { backgroundColor: colors.background.default }]}
            edges={["bottom"]}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary.main}
                        colors={[colors.primary.main]}
                    />
                }
            >
                {/* Timeline */}
                <View style={tw`p-4`}>
                    <OrderTimeline
                        currentStatus={order.status}
                        createdAt={order.createdAt}
                    />
                </View>

                {/* Payment status banner */}
                <MotiView
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 280 }}
                    style={[
                        tw`mx-4 mb-2 p-3 rounded-2xl flex-row items-center`,
                        { backgroundColor: paymentStatusMeta.softBg },
                    ]}
                >
                    <View
                        style={[
                            tw`w-10 h-10 rounded-full items-center justify-center`,
                            { backgroundColor: paymentStatusMeta.color },
                        ]}
                    >
                        <Ionicons
                            name={paymentStatusMeta.icon as any}
                            size={20}
                            color="#fff"
                        />
                    </View>
                    <View style={tw`flex-1 ml-3`}>
                        <Text
                            style={[
                                tw`font-semibold`,
                                { color: paymentStatusMeta.color },
                            ]}
                        >
                            {paymentStatusMeta.label}
                        </Text>
                        <View style={tw`flex-row items-center mt-0.5`}>
                            <Ionicons
                                name={paymentMeta.icon as any}
                                size={12}
                                color={colors.text.secondary}
                            />
                            <Text
                                style={[tw`text-xs ml-1`, { color: colors.text.secondary }]}
                            >
                                {paymentMeta.label}
                            </Text>
                        </View>
                    </View>
                    {order.transId && (
                        <View>
                            <Text style={[tw`text-xs`, { color: colors.text.secondary }]}>
                                Mã GD
                            </Text>
                            <Text
                                style={[tw`text-xs font-semibold`, { color: colors.text.primary }]}
                            >
                                {order.transId}
                            </Text>
                        </View>
                    )}
                </MotiView>

                {/* Order Info */}
                <View
                    style={[
                        tw`mx-4 mb-2 p-4 rounded-2xl`,
                        { backgroundColor: colors.background.paper },
                    ]}
                >
                    <View style={tw`flex-row items-center mb-3`}>
                        <Ionicons name="document-text" size={18} color={colors.primary.main} />
                        <Text
                            style={[tw`text-base font-semibold ml-2`, { color: colors.text.primary }]}
                        >
                            Thông tin đơn hàng
                        </Text>
                    </View>
                    <Row label="Mã đơn hàng" value={order.orderCode} bold />
                    <Row
                        label="Ngày đặt"
                        value={new Date(order.createdAt).toLocaleString("vi-VN")}
                    />
                </View>

                {/* Shipping */}
                <View
                    style={[
                        tw`mx-4 mb-2 p-4 rounded-2xl`,
                        { backgroundColor: colors.background.paper },
                    ]}
                >
                    <View style={tw`flex-row items-center mb-3`}>
                        <Ionicons name="location" size={18} color={colors.primary.main} />
                        <Text
                            style={[tw`text-base font-semibold ml-2`, { color: colors.text.primary }]}
                        >
                            Địa chỉ nhận hàng
                        </Text>
                    </View>
                    <Text
                        style={[tw`font-semibold`, { color: colors.text.primary }]}
                    >
                        {order.receiverName}
                    </Text>
                    <Text style={[tw`mt-1`, { color: colors.text.secondary }]}>
                        {order.receiverPhone}
                    </Text>
                    <Text style={[tw`mt-1`, { color: colors.text.secondary }]}>
                        {order.shippingAddress}
                    </Text>
                </View>

                {/* Products */}
                <View
                    style={[
                        tw`mx-4 mb-2 p-4 rounded-2xl`,
                        { backgroundColor: colors.background.paper },
                    ]}
                >
                    <View style={tw`flex-row items-center mb-3`}>
                        <Ionicons name="cube" size={18} color={colors.primary.main} />
                        <Text
                            style={[tw`text-base font-semibold ml-2`, { color: colors.text.primary }]}
                        >
                            Sản phẩm ({order.items.length})
                        </Text>
                    </View>
                    {order.items.map((item, index) => (
                        <View
                            key={index}
                            style={[
                                tw`flex-row py-3`,
                                index > 0
                                    ? { borderTopWidth: 1, borderColor: colors.border.light }
                                    : null,
                            ]}
                        >
                            <Image
                                source={{
                                    uri: item.product.image || "https://via.placeholder.com/80",
                                }}
                                style={tw`w-20 h-20 rounded-xl`}
                            />
                            <View style={tw`flex-1 ml-3 justify-between`}>
                                <Text
                                    style={[tw`font-semibold`, { color: colors.text.primary }]}
                                    numberOfLines={2}
                                >
                                    {item.product.name}
                                </Text>
                                <View style={tw`flex-row justify-between items-center`}>
                                    <Text
                                        style={[tw`text-xs`, { color: colors.text.secondary }]}
                                    >
                                        Số lượng: {item.quantity}
                                    </Text>
                                    <Text
                                        style={[tw`text-base font-bold`, { color: colors.primary.main }]}
                                    >
                                        ₫{item.unitPrice.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Price */}
                <View
                    style={[
                        tw`mx-4 mb-2 p-4 rounded-2xl`,
                        { backgroundColor: colors.background.paper },
                    ]}
                >
                    <Row label="Tạm tính" value={`₫${order.total.toLocaleString()}`} />
                    <Row
                        label="Giảm giá"
                        value={`-₫${order.discount.toLocaleString()}`}
                    />
                    <View
                        style={[
                            tw`flex-row justify-between pt-2 mt-2`,
                            { borderTopWidth: 1, borderColor: colors.border.light },
                        ]}
                    >
                        <Text
                            style={[tw`font-semibold`, { color: colors.text.primary }]}
                        >
                            Tổng cộng
                        </Text>
                        <Text
                            style={[tw`text-xl font-bold`, { color: colors.primary.main }]}
                        >
                            ₫{(order.total - order.discount).toLocaleString()}
                        </Text>
                    </View>
                </View>

                {order.note ? (
                    <View
                        style={[
                            tw`mx-4 mb-2 p-4 rounded-2xl`,
                            { backgroundColor: colors.background.paper },
                        ]}
                    >
                        <Text
                            style={[tw`text-base font-semibold mb-2`, { color: colors.text.primary }]}
                        >
                            Ghi chú
                        </Text>
                        <Text style={{ color: colors.text.secondary }}>{order.note}</Text>
                    </View>
                ) : null}

                {order.cancellationReason ? (
                    <View
                        style={[
                            tw`mx-4 mb-2 p-4 rounded-2xl`,
                            { backgroundColor: "#FDE8E7" },
                        ]}
                    >
                        <Text
                            style={[tw`text-base font-semibold mb-2`, { color: colors.error.dark }]}
                        >
                            Lý do hủy
                        </Text>
                        <Text style={{ color: colors.text.primary }}>
                            {order.cancellationReason}
                        </Text>
                    </View>
                ) : null}

                <View style={tw`h-6`} />
            </ScrollView>

            {/* Actions */}
            {!isTerminal && (showRetryMomo || order.canCancel !== "none") && (
                <MotiView
                    from={{ translateY: 40, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    transition={{ type: "timing", duration: 300 }}
                    style={[
                        tw`px-4 pt-3 border-t`,
                        {
                            backgroundColor: colors.background.paper,
                            borderColor: colors.border.light,
                            paddingBottom: Math.max(insets.bottom, 10),
                        },
                    ]}
                >
                    {showRetryMomo && (
                        <Button
                            mode="contained"
                            onPress={handleRetryMomo}
                            loading={isRetryingPayment}
                            disabled={isRetryingPayment}
                            icon="wallet"
                            style={[
                                tw`mb-2 rounded-xl`,
                                { backgroundColor: colors.provider.momo },
                            ]}
                            contentStyle={tw`py-2`}
                            labelStyle={tw`text-white font-semibold`}
                        >
                            Thanh toán với MoMo
                        </Button>
                    )}
                    <View style={tw`flex-row`}>
                        <Button
                            mode="contained-tonal"
                            onPress={() => navigation.navigate("OrderTracking", { orderId })}
                            icon="map-marker-path"
                            style={tw`flex-1 mr-2 rounded-xl`}
                            contentStyle={tw`py-2`}
                            labelStyle={tw`font-semibold`}
                        >
                            Theo dõi
                        </Button>
                        {order.canCancel !== "none" && (
                            <Button
                                mode="outlined"
                                onPress={() => setCancelModalVisible(true)}
                                style={[
                                    tw`flex-1 rounded-xl`,
                                    { borderColor: colors.error.main },
                                ]}
                                contentStyle={tw`py-2`}
                                labelStyle={tw`font-semibold`}
                                textColor={colors.error.main}
                            >
                                {cancelButtonLabel}
                            </Button>
                        )}
                    </View>
                </MotiView>
            )}

            {/* Cancel modal */}
            <Portal>
                <Modal
                    visible={cancelModalVisible}
                    onDismiss={() => setCancelModalVisible(false)}
                    contentContainerStyle={[
                        tw`mx-6 p-5 rounded-3xl`,
                        { backgroundColor: colors.background.paper },
                    ]}
                >
                    <Text
                        style={[tw`text-lg font-bold mb-2`, { color: colors.text.primary }]}
                    >
                        {cancelButtonLabel}
                    </Text>
                    {order.canCancel === "request" && (
                        <Text
                            style={[
                                tw`text-xs mb-2`,
                                { color: colors.warning.dark },
                            ]}
                        >
                            ⚠️ Đơn đang được chuẩn bị/giao — yêu cầu sẽ được gửi đến shop để xác nhận.
                        </Text>
                    )}
                    <TextInput
                        placeholder="Nhập lý do hủy đơn hàng..."
                        value={cancellationReason}
                        onChangeText={setCancellationReason}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor={colors.text.hint}
                        style={[
                            tw`rounded-xl px-3 py-3 mb-3`,
                            {
                                borderWidth: 1,
                                borderColor: colors.border.light,
                                color: colors.text.primary,
                                minHeight: 80,
                            },
                        ]}
                        textAlignVertical="top"
                    />
                    <View style={tw`flex-row`}>
                        <Button
                            mode="outlined"
                            onPress={() => {
                                setCancelModalVisible(false);
                                setCancellationReason("");
                            }}
                            style={tw`flex-1 mr-2 rounded-xl`}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleCancelOrder}
                            loading={isCanceling}
                            style={[
                                tw`flex-1 rounded-xl`,
                                { backgroundColor: colors.error.main },
                            ]}
                        >
                            Xác nhận
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
};

const Row: React.FC<{ label: string; value: string; bold?: boolean }> = ({
    label,
    value,
    bold,
}) => (
    <View style={tw`flex-row justify-between py-1`}>
        <Text style={{ color: colors.text.secondary }}>{label}</Text>
        <Text
            style={[
                bold ? tw`font-semibold` : null,
                { color: colors.text.primary },
            ]}
        >
            {value}
        </Text>
    </View>
);
