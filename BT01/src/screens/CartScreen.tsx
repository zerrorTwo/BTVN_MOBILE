import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ActivityIndicator, Snackbar, Portal, Modal } from "react-native-paper";
import { useSelector } from 'react-redux';
import tw from "twrnc";
import { StatusBar } from "expo-status-bar";
import { CartItem } from "../components/CartItem";
import {
    useGetCartQuery,
    useUpdateCartItemMutation,
    useRemoveCartItemMutation,
    useClearCartMutation,
} from "../services/api/cartApi";
import type { RootState } from '../store';

export const CartScreen = ({ navigation }: any) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data, isLoading, refetch } = useGetCartQuery(undefined, {
        skip: !user,
    });
    const [updateCartItem] = useUpdateCartItemMutation();
    const [removeCartItem] = useRemoveCartItemMutation();
    const [clearCart] = useClearCartMutation();
    const [refreshing, setRefreshing] = useState(false);
    const [snackMessage, setSnackMessage] = useState("");

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        confirmLabel: string;
    }>({
        title: "",
        message: "",
        onConfirm: () => { },
        confirmLabel: "Xóa",
    });

    const onRefresh = useCallback(async () => {
        if (!user) return;
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleUpdateQuantity = useCallback(
        async (itemId: number, quantity: number) => {
            try {
                await updateCartItem({ itemId, data: { quantity } }).unwrap();
            } catch (error: any) {
                setSnackMessage(error.data?.message || "Không thể cập nhật số lượng");
            }
        },
        [updateCartItem]
    );

    const handleRemoveItem = useCallback(
        (itemId: number) => {
            setModalConfig({
                title: "Xóa sản phẩm",
                message: "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
                confirmLabel: "Xóa",
                onConfirm: async () => {
                    try {
                        await removeCartItem(itemId).unwrap();
                        setSnackMessage("Đã xóa sản phẩm khỏi giỏ hàng");
                    } catch (error: any) {
                        setSnackMessage(error.data?.message || "Không thể xóa sản phẩm");
                    }
                    setModalVisible(false);
                },
            });
            setModalVisible(true);
        },
        [removeCartItem]
    );

    const handleClearCart = useCallback(() => {
        setModalConfig({
            title: "Xóa giỏ hàng",
            message: "Bạn có chắc muốn xóa toàn bộ giỏ hàng? Hành động này không thể hoàn tác.",
            confirmLabel: "Xóa tất cả",
            onConfirm: async () => {
                try {
                    await clearCart().unwrap();
                    setSnackMessage("Đã xóa toàn bộ giỏ hàng");
                } catch (error: any) {
                    setSnackMessage(error.data?.message || "Không thể xóa giỏ hàng");
                }
                setModalVisible(false);
            },
        });
        setModalVisible(true);
    }, [clearCart]);

    const handleCheckout = useCallback(() => {
        if (!data?.data || data.data.items.length === 0) {
            setSnackMessage("Giỏ hàng đang trống");
            return;
        }
        navigation.navigate("Checkout");
    }, [data, navigation]);

    if (!user) {
        return (
            <SafeAreaView style={tw`flex-1 bg-gray-50 justify-center items-center px-6`} edges={["top", "bottom"]}>
                <StatusBar style="dark" />
                <Text style={tw`text-6xl mb-4`}>🔒</Text>
                <Text style={tw`text-xl font-bold text-gray-800 text-center`}>
                    Đăng nhập để xem giỏ hàng
                </Text>
                <Text style={tw`text-sm text-gray-500 mt-2 text-center`}>
                    Bạn cần đăng nhập để quản lý giỏ hàng của mình
                </Text>
                <Button
                    mode="contained"
                    onPress={() => navigation.navigate('Login')}
                    style={tw`mt-6 rounded-xl`}
                    buttonColor="#EE4D2D"
                >
                    Đăng nhập ngay
                </Button>
            </SafeAreaView>
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-50`} edges={["top", "bottom"]}>
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color="#EE4D2D" />
            </SafeAreaView>
        );
    }

    const cart = data?.data;
    const isEmpty = !cart || cart.items.length === 0;

    if (isEmpty) {
        return (
            <SafeAreaView style={tw`flex-1 bg-gray-50 justify-center items-center px-6`} edges={["top", "bottom"]}>
                <StatusBar style="dark" />
                <Text style={tw`text-6xl mb-4`}>🛒</Text>
                <Text style={tw`text-xl font-bold text-gray-800 text-center`}>
                    Giỏ hàng trống
                </Text>
                <Text style={tw`text-sm text-gray-500 mt-2 text-center`}>
                    Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
                </Text>
                <Button
                    mode="contained"
                    onPress={() => navigation.navigate("Home", { screen: "HomeTab" })}
                    style={tw`mt-6 rounded-xl`}
                    buttonColor="#EE4D2D"
                >
                    Mua sắm ngay
                </Button>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["top", "bottom"]}>
            <StatusBar style="dark" />
            <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
                <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-lg font-bold`}>
                        Giỏ hàng ({cart.itemCount} sp)
                    </Text>
                    <TouchableOpacity onPress={handleClearCart}>
                        <Text style={tw`text-sm text-[#EE4D2D]`}>Xóa tất cả</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={tw`flex-1 px-4 py-2`}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {cart.items.map((item) => (
                    <CartItem
                        key={`cart-item-${item.id}`}
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                    />
                ))}
            </ScrollView>

            <View style={tw`bg-white px-4 py-4 border-t border-gray-200`}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                    <Text style={tw`text-base text-gray-600`}>Tạm tính</Text>
                    <Text style={tw`text-xl font-bold text-[#EE4D2D]`}>
                        ₫{cart.subtotal.toLocaleString()}
                    </Text>
                </View>
                <Button
                    mode="contained"
                    onPress={handleCheckout}
                    style={tw`bg-[#EE4D2D] py-1`}
                    labelStyle={tw`text-base font-semibold`}
                >
                    Thanh toán ({cart.itemCount} sản phẩm)
                </Button>
            </View>

            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={tw`bg-white mx-10 p-5 rounded-2xl`}
                >
                    <Text style={tw`text-lg font-bold text-gray-800 mb-2`}>
                        {modalConfig.title}
                    </Text>
                    <Text style={tw`text-gray-600 mb-6 text-base`}>
                        {modalConfig.message}
                    </Text>
                    <View style={tw`flex-row justify-end`}>
                        <Button
                            mode="text"
                            onPress={() => setModalVisible(false)}
                            style={tw`mr-2`}
                            textColor="#666"
                        >
                            Hủy
                        </Button>
                        <Button
                            mode="contained"
                            onPress={modalConfig.onConfirm}
                            buttonColor="#EE4D2D"
                            style={tw`rounded-lg`}
                        >
                            {modalConfig.confirmLabel}
                        </Button>
                    </View>
                </Modal>
            </Portal>

            <Snackbar
                visible={!!snackMessage}
                onDismiss={() => setSnackMessage("")}
                duration={3000}
                style={tw`mb-20`}
                action={{
                    label: "Đóng",
                    onPress: () => setSnackMessage(""),
                }}
            >
                {snackMessage}
            </Snackbar>
        </SafeAreaView>
    );
};
