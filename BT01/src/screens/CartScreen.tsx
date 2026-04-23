import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Portal, Modal } from "react-native-paper";
import { useSelector } from "react-redux";
import tw from "twrnc";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Toast from "react-native-toast-message";
import { CartItem } from "../components/CartItem";
import { EmptyState } from "../components/EmptyState";
import { CartItemSkeleton } from "../components/Skeleton";
import {
    useGetCartQuery,
    useUpdateCartItemMutation,
    useRemoveCartItemMutation,
    useClearCartMutation,
} from "../services/api/cartApi";
import type { RootState } from "../store";
import { colors } from "../theme";

export const CartScreen = ({ navigation }: any) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data, isLoading, refetch } = useGetCartQuery(undefined, {
        skip: !user,
    });
    const [updateCartItem] = useUpdateCartItemMutation();
    const [removeCartItem] = useRemoveCartItemMutation();
    const [clearCart] = useClearCartMutation();
    const [refreshing, setRefreshing] = useState(false);

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
    }, [refetch, user]);

    const handleUpdateQuantity = useCallback(
        async (itemId: number, quantity: number) => {
            try {
                await updateCartItem({ itemId, data: { quantity } }).unwrap();
            } catch (error: any) {
                Toast.show({
                    type: "error",
                    text1: "Không thể cập nhật",
                    text2: error.data?.message || "Vui lòng thử lại",
                });
            }
        },
        [updateCartItem],
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
                        Toast.show({
                            type: "success",
                            text1: "Đã xóa sản phẩm",
                        });
                    } catch (error: any) {
                        Toast.show({
                            type: "error",
                            text1: "Không thể xóa",
                            text2: error.data?.message,
                        });
                    }
                    setModalVisible(false);
                },
            });
            setModalVisible(true);
        },
        [removeCartItem],
    );

    const handleClearCart = useCallback(() => {
        setModalConfig({
            title: "Xóa giỏ hàng",
            message: "Bạn có chắc muốn xóa toàn bộ giỏ hàng? Hành động này không thể hoàn tác.",
            confirmLabel: "Xóa tất cả",
            onConfirm: async () => {
                try {
                    await clearCart().unwrap();
                    Toast.show({
                        type: "success",
                        text1: "Đã xóa giỏ hàng",
                    });
                } catch (error: any) {
                    Toast.show({
                        type: "error",
                        text1: "Không thể xóa",
                        text2: error.data?.message,
                    });
                }
                setModalVisible(false);
            },
        });
        setModalVisible(true);
    }, [clearCart]);

    const handleCheckout = useCallback(() => {
        if (!data?.data || data.data.items.length === 0) {
            Toast.show({ type: "warning", text1: "Giỏ hàng trống" });
            return;
        }
        navigation.navigate("Checkout");
    }, [data, navigation]);

    if (!user) {
        return (
            <SafeAreaView
                style={[tw`flex-1`, { backgroundColor: colors.background.default }]}
                edges={["top", "bottom"]}
            >
                <StatusBar style="dark" />
                <EmptyState
                    iconName="lock-closed-outline"
                    iconColor={colors.primary.main}
                    title="Đăng nhập để xem giỏ hàng"
                    message="Bạn cần đăng nhập để quản lý giỏ hàng của mình"
                    buttonText="Đăng nhập ngay"
                    onButtonPress={() => navigation.navigate("Login")}
                />
            </SafeAreaView>
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView
                style={[tw`flex-1`, { backgroundColor: colors.background.default }]}
                edges={["top", "bottom"]}
            >
                <StatusBar style="dark" />
                <View
                    style={[
                        tw`px-4 py-3 border-b`,
                        {
                            backgroundColor: colors.background.paper,
                            borderColor: colors.border.light,
                        },
                    ]}
                >
                    <Text
                        style={[tw`text-lg font-bold`, { color: colors.text.primary }]}
                    >
                        Giỏ hàng
                    </Text>
                </View>
                <View style={tw`px-4 py-3`}>
                    <CartItemSkeleton />
                    <CartItemSkeleton />
                    <CartItemSkeleton />
                </View>
            </SafeAreaView>
        );
    }

    const cart = data?.data;
    const isEmpty = !cart || cart.items.length === 0;

    if (isEmpty) {
        return (
            <SafeAreaView
                style={[tw`flex-1`, { backgroundColor: colors.background.default }]}
                edges={["top", "bottom"]}
            >
                <StatusBar style="dark" />
                <EmptyState
                    iconName="cart-outline"
                    iconColor={colors.primary.main}
                    title="Giỏ hàng trống"
                    message="Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm"
                    buttonText="Mua sắm ngay"
                    onButtonPress={() => navigation.navigate("Home", { screen: "HomeTab" })}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={[tw`flex-1`, { backgroundColor: colors.background.default }]}
            edges={["top", "bottom"]}
        >
            <StatusBar style="dark" />
            <View
                style={[
                    tw`px-4 py-3 border-b flex-row justify-between items-center`,
                    {
                        backgroundColor: colors.background.paper,
                        borderColor: colors.border.light,
                    },
                ]}
            >
                <View style={tw`flex-row items-center`}>
                    <Ionicons name="cart" size={22} color={colors.primary.main} />
                    <Text
                        style={[tw`text-lg font-bold ml-2`, { color: colors.text.primary }]}
                    >
                        Giỏ hàng ({cart.itemCount})
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleClearCart}
                    style={tw`flex-row items-center`}
                >
                    <Ionicons name="trash-outline" size={16} color={colors.error.main} />
                    <Text
                        style={[tw`text-sm ml-1 font-semibold`, { color: colors.error.main }]}
                    >
                        Xóa tất cả
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={tw`flex-1 px-4 py-2`}
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
                {cart.items.map((item, i) => (
                    <MotiView
                        key={`cart-item-${item.id}`}
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: "timing", duration: 220, delay: i * 35 }}
                    >
                        <CartItem
                            item={item}
                            onUpdateQuantity={handleUpdateQuantity}
                            onRemove={handleRemoveItem}
                        />
                    </MotiView>
                ))}
                <View style={tw`h-6`} />
            </ScrollView>

            <MotiView
                from={{ translateY: 40, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{ type: "timing", duration: 300 }}
                style={[
                    tw`px-4 py-4 border-t`,
                    {
                        backgroundColor: colors.background.paper,
                        borderColor: colors.border.light,
                    },
                ]}
            >
                <View style={tw`flex-row justify-between items-center mb-3`}>
                    <Text
                        style={[tw`text-sm`, { color: colors.text.secondary }]}
                    >
                        Tạm tính ({cart.itemCount} sản phẩm)
                    </Text>
                    <Text
                        style={[tw`text-2xl font-bold`, { color: colors.primary.main }]}
                    >
                        ₫{cart.subtotal.toLocaleString()}
                    </Text>
                </View>
                <Button
                    mode="contained"
                    onPress={handleCheckout}
                    icon="arrow-right"
                    contentStyle={tw`flex-row-reverse py-1`}
                    style={[
                        tw`rounded-xl`,
                        { backgroundColor: colors.primary.main },
                    ]}
                    labelStyle={tw`text-base font-semibold text-white`}
                >
                    Tiến hành thanh toán
                </Button>
            </MotiView>

            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={[
                        tw`mx-8 p-6 rounded-3xl`,
                        { backgroundColor: colors.background.paper },
                    ]}
                >
                    <View
                        style={[
                            tw`w-14 h-14 rounded-full items-center justify-center self-center mb-4`,
                            { backgroundColor: "#FDE8E7" },
                        ]}
                    >
                        <Ionicons name="warning" size={28} color={colors.error.main} />
                    </View>
                    <Text
                        style={[
                            tw`text-lg font-bold mb-2 text-center`,
                            { color: colors.text.primary },
                        ]}
                    >
                        {modalConfig.title}
                    </Text>
                    <Text
                        style={[
                            tw`mb-6 text-center`,
                            { color: colors.text.secondary, fontSize: 14 },
                        ]}
                    >
                        {modalConfig.message}
                    </Text>
                    <View style={tw`flex-row`}>
                        <Button
                            mode="outlined"
                            onPress={() => setModalVisible(false)}
                            style={tw`flex-1 mr-2 rounded-xl`}
                            textColor={colors.text.secondary}
                        >
                            Hủy
                        </Button>
                        <Button
                            mode="contained"
                            onPress={modalConfig.onConfirm}
                            style={[tw`flex-1 rounded-xl`, { backgroundColor: colors.error.main }]}
                            labelStyle={tw`text-white`}
                        >
                            {modalConfig.confirmLabel}
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
};
