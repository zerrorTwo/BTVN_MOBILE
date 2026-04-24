import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, IconButton } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Toast from "react-native-toast-message";
import tw from "twrnc";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { useGetCartQuery, useClearCartMutation } from "../services/api/cartApi";
import { useCheckoutMutation } from "../services/api/orderApi";
import { PaymentMethod } from "../types/order.types";
import { colors, PAYMENT_METHOD_META } from "../theme";

const ORDERED_METHODS: PaymentMethod[] = [
    PaymentMethod.COD,
    PaymentMethod.MOMO,
    PaymentMethod.VNPAY,
    PaymentMethod.ZALOPAY,
];

export const CheckoutScreen = ({ navigation }: any) => {
    const user = useSelector((state: RootState) => state.auth.user);
    const { data: cartData } = useGetCartQuery();
    const [clearCart] = useClearCartMutation();
    const [checkout, { isLoading }] = useCheckoutMutation();

    const [shippingAddress, setShippingAddress] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [receiverPhone, setReceiverPhone] = useState("");
    const [note, setNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
        PaymentMethod.COD,
    );

    useEffect(() => {
        if (user) {
            setReceiverName(user.name || "");
            setReceiverPhone(user.phone || "");

            const addressParts = [];
            if (user.address) addressParts.push(user.address);
            if (user.ward) addressParts.push(user.ward);
            if (user.district) addressParts.push(user.district);
            if (user.city) addressParts.push(user.city);

            if (addressParts.length > 0) {
                setShippingAddress(addressParts.join(", "));
            }
        }
    }, [user]);

    const handlePlaceOrder = async () => {
        if (!shippingAddress.trim()) {
            Toast.show({ type: "warning", text1: "Vui lòng nhập địa chỉ giao hàng" });
            return;
        }
        if (!receiverName.trim()) {
            Toast.show({ type: "warning", text1: "Vui lòng nhập tên người nhận" });
            return;
        }
        if (!receiverPhone.trim()) {
            Toast.show({ type: "warning", text1: "Vui lòng nhập số điện thoại" });
            return;
        }

        try {
            const result = await checkout({
                paymentMethod,
                shippingAddress,
                receiverName,
                receiverPhone,
                note: note.trim() || undefined,
            }).unwrap();

            const orderId = result.data?.orderId;
            const payUrl = result.data?.payUrl;

            if (paymentMethod === PaymentMethod.MOMO && payUrl && orderId) {
                navigation.reset({
                    index: 1,
                    routes: [
                        { name: "Home" },
                        { name: "PaymentWebView", params: { orderId, payUrl } },
                    ],
                });
                return;
            }

            // Keep client cart in sync after successful order placement.
            // For COD this should clear immediately; for gateway flows it is handled on payment success screen.
            if (paymentMethod !== PaymentMethod.MOMO) {
                try {
                    await clearCart().unwrap();
                } catch {
                    // Non-blocking: order already created, cart can still be refreshed later.
                }
            }

            Toast.show({
                type: "success",
                text1: "Đặt hàng thành công",
                text2: paymentMethod === PaymentMethod.MOMO
                    ? "Bạn có thể thanh toán lại từ chi tiết đơn"
                    : "Đơn hàng đang chờ xác nhận",
            });
            navigation.reset({
                index: 1,
                routes: [
                    { name: "Home" },
                    { name: "OrderDetail", params: { orderId } },
                ],
            });
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Không thể đặt hàng",
                text2: error.data?.message || "Vui lòng thử lại",
            });
        }
    };

    const cart = cartData?.data;
    const total = cart?.subtotal || 0;

    return (
        <SafeAreaView
            style={[tw`flex-1`, { backgroundColor: colors.background.default }]}
            edges={["top", "bottom"]}
        >
            <StatusBar style="dark" />

            {/* Header */}
            <View
                style={[
                    tw`flex-row items-center justify-between px-2 py-2 border-b`,
                    {
                        backgroundColor: colors.background.paper,
                        borderColor: colors.border.light,
                    },
                ]}
            >
                <IconButton
                    icon="arrow-left"
                    size={22}
                    onPress={() => navigation.goBack()}
                    iconColor={colors.text.primary}
                />
                <Text
                    style={[tw`text-lg font-semibold`, { color: colors.text.primary }]}
                >
                    Đặt hàng
                </Text>
                <View style={tw`w-[40px]`} />
            </View>

            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                {/* Shipping Address */}
                <MotiView
                    from={{ opacity: 0, translateY: 12 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 260 }}
                    style={[tw`p-4 mb-2`, { backgroundColor: colors.background.paper }]}
                >
                    <View style={tw`flex-row items-center mb-3`}>
                        <Ionicons name="location" size={18} color={colors.primary.main} />
                        <Text
                            style={[tw`text-base font-semibold ml-2`, { color: colors.text.primary }]}
                        >
                            Địa chỉ giao hàng
                        </Text>
                    </View>

                    <TextInput
                        placeholder="Họ và tên người nhận *"
                        value={receiverName}
                        onChangeText={setReceiverName}
                        placeholderTextColor={colors.text.hint}
                        style={[
                            tw`rounded-xl px-3 py-3 mb-3`,
                            {
                                borderWidth: 1,
                                borderColor: colors.border.light,
                                color: colors.text.primary,
                            },
                        ]}
                    />

                    <TextInput
                        placeholder="Số điện thoại *"
                        value={receiverPhone}
                        onChangeText={setReceiverPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.text.hint}
                        style={[
                            tw`rounded-xl px-3 py-3 mb-3`,
                            {
                                borderWidth: 1,
                                borderColor: colors.border.light,
                                color: colors.text.primary,
                            },
                        ]}
                    />

                    <TextInput
                        placeholder="Địa chỉ chi tiết *"
                        value={shippingAddress}
                        onChangeText={setShippingAddress}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor={colors.text.hint}
                        style={[
                            tw`rounded-xl px-3 py-3`,
                            {
                                borderWidth: 1,
                                borderColor: colors.border.light,
                                color: colors.text.primary,
                                minHeight: 72,
                            },
                        ]}
                        textAlignVertical="top"
                    />
                </MotiView>

                {/* Items */}
                <MotiView
                    from={{ opacity: 0, translateY: 12 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 260, delay: 60 }}
                    style={[tw`p-4 mb-2`, { backgroundColor: colors.background.paper }]}
                >
                    <View style={tw`flex-row items-center mb-3`}>
                        <Ionicons name="cube-outline" size={18} color={colors.primary.main} />
                        <Text
                            style={[tw`text-base font-semibold ml-2`, { color: colors.text.primary }]}
                        >
                            Sản phẩm ({cart?.itemCount || 0})
                        </Text>
                    </View>
                    {cart?.items.map((item, index) => (
                        <View
                            key={index}
                            style={[
                                tw`flex-row justify-between py-2`,
                                index < (cart?.items.length || 0) - 1
                                    ? { borderBottomWidth: 1, borderColor: colors.border.light }
                                    : null,
                            ]}
                        >
                            <Text
                                style={[tw`flex-1 pr-2`, { color: colors.text.primary }]}
                                numberOfLines={2}
                            >
                                {item.product.name}{" "}
                                <Text style={{ color: colors.text.secondary }}>
                                    x{item.quantity}
                                </Text>
                            </Text>
                            <Text
                                style={[tw`font-semibold`, { color: colors.text.primary }]}
                            >
                                ₫{item.itemTotal.toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </MotiView>

                {/* Payment Method */}
                <MotiView
                    from={{ opacity: 0, translateY: 12 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 260, delay: 120 }}
                    style={[tw`p-4 mb-2`, { backgroundColor: colors.background.paper }]}
                >
                    <View style={tw`flex-row items-center mb-3`}>
                        <Ionicons name="wallet" size={18} color={colors.primary.main} />
                        <Text
                            style={[tw`text-base font-semibold ml-2`, { color: colors.text.primary }]}
                        >
                            Phương thức thanh toán
                        </Text>
                    </View>

                    {ORDERED_METHODS.map((method) => {
                        const meta = PAYMENT_METHOD_META[method];
                        const selected = paymentMethod === method;
                        const disabled = !meta.enabled;
                        return (
                            <TouchableOpacity
                                key={method}
                                disabled={disabled}
                                onPress={() => setPaymentMethod(method)}
                                activeOpacity={0.8}
                                style={[
                                    tw`flex-row items-center p-3 rounded-2xl mb-2`,
                                    {
                                        borderWidth: selected ? 2 : 1,
                                        borderColor: selected ? meta.color : colors.border.light,
                                        backgroundColor: selected ? meta.softBg : colors.background.paper,
                                        opacity: disabled ? 0.5 : 1,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        tw`w-10 h-10 rounded-xl items-center justify-center`,
                                        { backgroundColor: selected ? meta.color : meta.softBg },
                                    ]}
                                >
                                    <Ionicons
                                        name={meta.icon as any}
                                        size={20}
                                        color={selected ? "#fff" : meta.color}
                                    />
                                </View>
                                <View style={tw`flex-1 ml-3`}>
                                    <Text
                                        style={[
                                            tw`font-semibold`,
                                            { color: disabled ? colors.text.hint : colors.text.primary },
                                        ]}
                                    >
                                        {meta.label}
                                    </Text>
                                    <Text
                                        style={[tw`text-xs mt-0.5`, { color: colors.text.secondary }]}
                                    >
                                        {method === PaymentMethod.COD
                                            ? "Trả tiền khi giao hàng"
                                            : method === PaymentMethod.MOMO
                                                ? "Thanh toán qua QR / ứng dụng MoMo"
                                                : "Sắp ra mắt"}
                                    </Text>
                                </View>
                                {selected && !disabled && (
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={22}
                                        color={meta.color}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </MotiView>

                {/* Note */}
                <MotiView
                    from={{ opacity: 0, translateY: 12 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 260, delay: 180 }}
                    style={[tw`p-4 mb-2`, { backgroundColor: colors.background.paper }]}
                >
                    <View style={tw`flex-row items-center mb-3`}>
                        <Ionicons
                            name="document-text-outline"
                            size={18}
                            color={colors.primary.main}
                        />
                        <Text
                            style={[tw`text-base font-semibold ml-2`, { color: colors.text.primary }]}
                        >
                            Ghi chú
                        </Text>
                    </View>
                    <TextInput
                        placeholder="Ghi chú cho người bán..."
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor={colors.text.hint}
                        style={[
                            tw`rounded-xl px-3 py-3`,
                            {
                                borderWidth: 1,
                                borderColor: colors.border.light,
                                color: colors.text.primary,
                                minHeight: 72,
                            },
                        ]}
                        textAlignVertical="top"
                    />
                </MotiView>

                {/* Price Summary */}
                <MotiView
                    from={{ opacity: 0, translateY: 12 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 260, delay: 240 }}
                    style={[tw`p-4 mb-4`, { backgroundColor: colors.background.paper }]}
                >
                    <View style={tw`flex-row justify-between py-2`}>
                        <Text style={{ color: colors.text.secondary }}>Tạm tính</Text>
                        <Text style={{ color: colors.text.primary }}>
                            ₫{cart?.subtotal.toLocaleString() || 0}
                        </Text>
                    </View>
                    <View style={tw`flex-row justify-between py-2`}>
                        <Text style={{ color: colors.text.secondary }}>Phí vận chuyển</Text>
                        <Text style={[tw`font-semibold`, { color: colors.success.main }]}>
                            Miễn phí
                        </Text>
                    </View>
                    <View
                        style={[
                            tw`flex-row justify-between pt-2 mt-2`,
                            { borderTopWidth: 1, borderColor: colors.border.light },
                        ]}
                    >
                        <Text
                            style={[tw`text-base font-semibold`, { color: colors.text.primary }]}
                        >
                            Tổng cộng
                        </Text>
                        <Text
                            style={[tw`text-xl font-bold`, { color: colors.primary.main }]}
                        >
                            ₫{total.toLocaleString()}
                        </Text>
                    </View>
                </MotiView>
            </ScrollView>

            {/* Bottom Bar */}
            <MotiView
                from={{ translateY: 40, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{ type: "timing", duration: 320 }}
                style={[
                    tw`px-4 py-4 border-t`,
                    {
                        backgroundColor: colors.background.paper,
                        borderColor: colors.border.light,
                    },
                ]}
            >
                <View style={tw`flex-row justify-between items-center mb-3`}>
                    <Text style={{ color: colors.text.secondary }}>Tổng thanh toán</Text>
                    <Text
                        style={[tw`text-2xl font-bold`, { color: colors.primary.main }]}
                    >
                        ₫{total.toLocaleString()}
                    </Text>
                </View>
                <Button
                    mode="contained"
                    onPress={handlePlaceOrder}
                    loading={isLoading}
                    disabled={isLoading}
                    icon={paymentMethod === PaymentMethod.MOMO ? "wallet" : "check"}
                    contentStyle={tw`py-1`}
                    style={[
                        tw`rounded-xl`,
                        {
                            backgroundColor:
                                paymentMethod === PaymentMethod.MOMO
                                    ? colors.provider.momo
                                    : colors.primary.main,
                        },
                    ]}
                    labelStyle={tw`text-base font-semibold text-white`}
                >
                    {paymentMethod === PaymentMethod.MOMO
                        ? "Thanh toán với MoMo"
                        : "Đặt hàng"}
                </Button>
            </MotiView>
        </SafeAreaView>
    );
};
