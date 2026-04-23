import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ActivityIndicator, RadioButton, IconButton } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import tw from "twrnc";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { useGetCartQuery } from "../services/api/cartApi";
import { useCheckoutMutation } from "../services/api/orderApi";
import { PaymentMethod } from "../types/order.types";

export const CheckoutScreen = ({ navigation }: any) => {
    const user = useSelector((state: RootState) => state.auth.user);
    const { data: cartData } = useGetCartQuery();
    const [checkout, { isLoading }] = useCheckoutMutation();

    const [shippingAddress, setShippingAddress] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [receiverPhone, setReceiverPhone] = useState("");
    const [note, setNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.COD);

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
            Alert.alert("Lỗi", "Vui lòng nhập địa chỉ giao hàng");
            return;
        }
        if (!receiverName.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập tên người nhận");
            return;
        }
        if (!receiverPhone.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
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

            // Navigate immediately — Alert.alert doesn't work on web
            navigation.reset({
                index: 1,
                routes: [
                    { name: 'Home' },
                    {
                        name: 'OrderDetail',
                        params: { orderId: result.data?.orderId },
                    },
                ],
            });
        } catch (error: any) {
            Alert.alert("Lỗi", error.data?.message || "Không thể đặt hàng");
        }
    };

    const cart = cartData?.data;
    const shippingFee = 30000;
    const total = (cart?.subtotal || 0) + shippingFee;

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["top", "bottom"]}>
            <StatusBar style="dark" />
            <View style={tw`flex-row items-center justify-between px-2 py-2 bg-white border-b border-gray-100`}>
                <IconButton
                    icon="arrow-left"
                    size={22}
                    onPress={() => navigation.goBack()}
                    iconColor="#111827"
                />
                <Text style={tw`text-lg font-semibold text-gray-900 text-center`}>Đặt hàng</Text>
                <View style={tw`w-[40px]`} />
            </View>
            <ScrollView style={tw`flex-1`}>
                {/* Shipping Address Section */}
                <View style={tw`bg-white p-4 mb-2`}>
                    <Text style={tw`text-base font-semibold mb-3`}>Địa chỉ giao hàng</Text>

                    <TextInput
                        placeholder="Họ và tên người nhận *"
                        value={receiverName}
                        onChangeText={setReceiverName}
                        style={tw`border border-gray-300 rounded px-3 py-2 mb-3`}
                    />

                    <TextInput
                        placeholder="Số điện thoại *"
                        value={receiverPhone}
                        onChangeText={setReceiverPhone}
                        keyboardType="phone-pad"
                        style={tw`border border-gray-300 rounded px-3 py-2 mb-3`}
                    />

                    <TextInput
                        placeholder="Địa chỉ chi tiết *"
                        value={shippingAddress}
                        onChangeText={setShippingAddress}
                        multiline
                        numberOfLines={3}
                        style={tw`border border-gray-300 rounded px-3 py-2`}
                        textAlignVertical="top"
                    />
                </View>

                {/* Order Items Section */}
                <View style={tw`bg-white p-4 mb-2`}>
                    <Text style={tw`text-base font-semibold mb-3`}>
                        Sản phẩm ({cart?.itemCount || 0})
                    </Text>
                    {cart?.items.map((item, index) => (
                        <View key={index} style={tw`flex-row justify-between py-2`}>
                            <Text style={tw`flex-1 text-gray-700`} numberOfLines={2}>
                                {item.product.name} x{item.quantity}
                            </Text>
                            <Text style={tw`text-gray-800 font-semibold`}>
                                ₫{item.itemTotal.toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Payment Method */}
                <View style={tw`bg-white p-4 mb-2`}>
                    <Text style={tw`text-base font-semibold mb-3`}>Phương thức thanh toán</Text>

                    <RadioButton.Group
                        onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                        value={paymentMethod}
                    >
                        <View style={tw`flex-row items-center`}>
                            <RadioButton value={PaymentMethod.COD} />
                            <Text style={tw`flex-1`}>Thanh toán khi nhận hàng (COD)</Text>
                        </View>
                        <View style={tw`flex-row items-center opacity-50`}>
                            <RadioButton value={PaymentMethod.MOMO} disabled />
                            <Text style={tw`flex-1 text-gray-400`}>Ví MoMo (Sắp ra mắt)</Text>
                        </View>
                        <View style={tw`flex-row items-center opacity-50`}>
                            <RadioButton value={PaymentMethod.VNPAY} disabled />
                            <Text style={tw`flex-1 text-gray-400`}>VNPay (Sắp ra mắt)</Text>
                        </View>
                    </RadioButton.Group>
                </View>

                {/* Note */}
                <View style={tw`bg-white p-4 mb-2`}>
                    <Text style={tw`text-base font-semibold mb-3`}>Ghi chú</Text>
                    <TextInput
                        placeholder="Ghi chú cho người bán..."
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                        style={tw`border border-gray-300 rounded px-3 py-2`}
                        textAlignVertical="top"
                    />
                </View>

                {/* Price Summary */}
                <View style={tw`bg-white p-4 mb-2`}>
                    <View style={tw`flex-row justify-between py-2`}>
                        <Text style={tw`text-gray-600`}>Tạm tính</Text>
                        <Text style={tw`text-gray-800`}>₫{cart?.subtotal.toLocaleString()}</Text>
                    </View>
                    <View style={tw`flex-row justify-between py-2`}>
                        <Text style={tw`text-gray-600`}>Phí vận chuyển</Text>
                        <Text style={tw`text-gray-800`}>₫{shippingFee.toLocaleString()}</Text>
                    </View>
                    <View style={tw`border-t border-gray-200 mt-2 pt-2 flex-row justify-between`}>
                        <Text style={tw`text-base font-semibold`}>Tổng cộng</Text>
                        <Text style={tw`text-xl font-bold text-[#0B5ED7]`}>
                            ₫{total.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View style={tw`bg-white px-4 py-4 border-t border-gray-200`}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                    <Text style={tw`text-gray-600`}>Tổng thanh toán</Text>
                    <Text style={tw`text-xl font-bold text-[#0B5ED7]`}>
                        ₫{total.toLocaleString()}
                    </Text>
                </View>
                <Button
                    mode="contained"
                    onPress={handlePlaceOrder}
                    loading={isLoading}
                    disabled={isLoading}
                    style={tw`bg-[#0B5ED7] py-1`}
                    labelStyle={tw`text-base font-semibold`}
                >
                    Đặt hàng
                </Button>
            </View>
        </SafeAreaView>
    );
};
