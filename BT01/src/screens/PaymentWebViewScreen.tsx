import React, { useEffect, useRef, useState } from "react";
import { View, Text, BackHandler, Linking, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton, Button, Portal, Modal } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import Toast from "react-native-toast-message";
import tw from "twrnc";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useClearCartMutation } from "../services/api/cartApi";
import { useGetOrderByIdQuery } from "../services/api/orderApi";
import { PaymentStatus } from "../types/order.types";
import { colors, gradients } from "../theme";

type Props = {
    route: { params: { orderId: number; payUrl: string } };
    navigation: any;
};

/**
 * Opens the MoMo checkout page inside an in-app WebView, then polls the order
 * every 2s to detect when the IPN has flipped paymentStatus to PAID.
 * Source of truth is the BE IPN, not this screen.
 */
export const PaymentWebViewScreen = ({ route, navigation }: Props) => {
    const { orderId, payUrl } = route.params;
    const [clearCart] = useClearCartMutation();
    const [webLoading, setWebLoading] = useState(true);
    const [pollEnabled, setPollEnabled] = useState(true);
    const [leaveModalVisible, setLeaveModalVisible] = useState(false);
    const webViewRef = useRef<WebView>(null);
    const initialStatusRef = useRef<string | null>(null);

    const { data, refetch } = useGetOrderByIdQuery(orderId, {
        pollingInterval: pollEnabled ? 2000 : 0,
    });

    const paymentStatus = data?.data?.paymentStatus;

    useEffect(() => {
        if (!paymentStatus) return;
        if (initialStatusRef.current === null) {
            initialStatusRef.current = paymentStatus;
            return;
        }
        if (paymentStatus === initialStatusRef.current) return;

        if (paymentStatus === PaymentStatus.PAID) {
            setPollEnabled(false);
            (async () => {
                try {
                    await clearCart().unwrap();
                } catch {
                    // Non-blocking: payment is already successful, cart can be re-synced on next fetch.
                }
                Toast.show({
                    type: "success",
                    text1: "Thanh toán thành công",
                    text2: "Đơn hàng của bạn đã được xác nhận",
                    visibilityTime: 2500,
                });
                setTimeout(() => {
                    navigation.reset({
                        index: 1,
                        routes: [
                            { name: "Home" },
                            { name: "OrderDetail", params: { orderId } },
                        ],
                    });
                }, 1500);
            })();
        } else if (paymentStatus === PaymentStatus.FAILED) {
            setPollEnabled(false);
            Toast.show({
                type: "error",
                text1: "Thanh toán thất bại",
                text2: "Bạn có thể thử lại từ chi tiết đơn hàng",
                visibilityTime: 2500,
            });
            setTimeout(() => {
                navigation.reset({
                    index: 1,
                    routes: [
                        { name: "Home" },
                        { name: "OrderDetail", params: { orderId } },
                    ],
                });
            }, 1500);
        }
    }, [paymentStatus, clearCart, navigation, orderId]);

    const handleNavChange = (nav: WebViewNavigation) => {
        if (
            nav.url.includes("/payments/momo/return") ||
            nav.url.includes("/api/payments/momo/return")
        ) {
            refetch();
        }
    };

    useEffect(() => {
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            setLeaveModalVisible(true);
            return true;
        });
        return () => sub.remove();
    }, []);

    return (
        <SafeAreaView
            style={[tw`flex-1`, { backgroundColor: colors.background.paper }]}
            edges={["top", "bottom"]}
        >
            <StatusBar style="light" />

            {/* Premium Header */}
            <LinearGradient
                colors={gradients.momo as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tw`px-2 pt-1 pb-4`}
            >
                <View style={tw`flex-row items-center justify-between`}>
                    <IconButton
                        icon="close"
                        size={24}
                        onPress={() => setLeaveModalVisible(true)}
                        iconColor="#fff"
                    />
                    <Text style={[tw`text-lg font-bold text-white`, { letterSpacing: 0.5 }]}>
                        Thanh toán MoMo
                    </Text>
                    <View style={tw`w-[40px]`} />
                </View>
            </LinearGradient>

            {/* Status indicator (Matching screenshot) */}
            {paymentStatus === PaymentStatus.UNPAID && (
                <View
                    style={[
                        tw`px-5 py-2.5 flex-row items-center`,
                        { backgroundColor: "#FFFBEB" }, // Lighter yellow matching screenshot
                    ]}
                >
                    <MotiView
                        from={{ scale: 0.8, opacity: 0.6 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "timing",
                            duration: 800,
                            loop: true,
                            repeatReverse: true,
                        }}
                        style={[
                            tw`w-2 h-2 rounded-full mr-3`,
                            { backgroundColor: "#F69113" },
                        ]}
                    />
                    <Text
                        style={[
                            tw`text-xs font-medium flex-1`,
                            { color: "#B45309", lineHeight: 16 },
                        ]}
                    >
                        Đang chờ xác nhận từ MoMo... Vui lòng không tắt cửa sổ.
                    </Text>
                </View>
            )}
            {paymentStatus === PaymentStatus.PAID && (
                <MotiView
                    from={{ translateY: -8, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    transition={{ type: "timing", duration: 260 }}
                    style={[
                        tw`px-4 py-2 flex-row items-center`,
                        { backgroundColor: "#E8F7F3" },
                    ]}
                >
                    <Ionicons name="checkmark-circle" size={18} color={colors.success.main} />
                    <Text
                        style={[tw`text-sm ml-2 font-semibold`, { color: colors.success.dark }]}
                    >
                        Thanh toán thành công — đang chuyển hướng...
                    </Text>
                </MotiView>
            )}

            {/* WebView */}
            <View style={tw`flex-1`}>
                {webLoading && (
                    <View
                        style={[
                            tw`absolute inset-0 items-center justify-center z-10`,
                            { backgroundColor: colors.background.paper },
                        ]}
                    >
                        <MotiView
                            from={{ scale: 0.9, opacity: 0, translateY: 10 }}
                            animate={{ scale: 1, opacity: 1, translateY: 0 }}
                            transition={{ type: "timing", duration: 400 }}
                            style={tw`items-center`}
                        >
                            <MotiView
                                from={{ scale: 0.8, opacity: 0.8 }}
                                animate={{ scale: 1.05, opacity: 1 }}
                                transition={{
                                    type: "timing",
                                    duration: 800,
                                    loop: true,
                                    repeatReverse: true,
                                }}
                                style={[
                                    tw`w-20 h-20 rounded-[24px] items-center justify-center mb-6`,
                                    { backgroundColor: colors.provider.momo },
                                ]}
                            >
                                <Ionicons name="wallet" size={36} color="#fff" />
                            </MotiView>
                            <Text
                                style={[tw`text-lg font-bold mb-2`, { color: colors.text.primary }]}
                            >
                                Kết nối an toàn
                            </Text>
                            <Text
                                style={[tw`text-sm text-center px-10`, { color: colors.text.secondary, lineHeight: 20 }]}
                            >
                                Đang mở cổng thanh toán MoMo. Vui lòng chờ trong giây lát...
                            </Text>
                        </MotiView>
                    </View>
                )}

                <WebView
                    ref={webViewRef}
                    source={{ uri: payUrl }}
                    onLoadEnd={() => setWebLoading(false)}
                    onNavigationStateChange={handleNavChange}
                    onShouldStartLoadWithRequest={(request) => {
                        // Handle deep links (itms-appss, momo, etc.)
                        const { url } = request;
                        if (
                            url.startsWith("itms-appss://") ||
                            url.startsWith("itms-apps://") ||
                            url.startsWith("momo://") ||
                            url.includes("apps.apple.com") ||
                            url.includes("play.google.com")
                        ) {
                            Linking.canOpenURL(url)
                                .then((supported) => {
                                    if (supported) {
                                        return Linking.openURL(url);
                                    }
                                    // If it's the app store link and can't open itms-appss, try https
                                    if (url.startsWith("itms-appss://")) {
                                        const httpsUrl = url.replace("itms-appss://", "https://");
                                        return Linking.openURL(httpsUrl);
                                    }
                                    return Promise.resolve();
                                })
                                .catch(() => {
                                    // Ignore deeplink open errors and keep user in current flow.
                                });
                            return false;
                        }
                        return true;
                    }}
                    startInLoadingState
                    javaScriptEnabled
                    domStorageEnabled
                    style={tw`flex-1`}
                />
            </View>

            {/* Leave confirmation */}
            <Portal>
                <Modal
                    visible={leaveModalVisible}
                    onDismiss={() => setLeaveModalVisible(false)}
                    contentContainerStyle={[
                        tw`mx-6 p-5 rounded-3xl`,
                        { backgroundColor: colors.background.paper },
                    ]}
                >
                    <View
                        style={[
                            tw`w-14 h-14 rounded-full items-center justify-center self-center mb-3`,
                            { backgroundColor: "#FFF4E5" },
                        ]}
                    >
                        <Ionicons name="warning" size={28} color={colors.warning.main} />
                    </View>
                    <Text
                        style={[
                            tw`text-lg font-bold text-center mb-2`,
                            { color: colors.text.primary },
                        ]}
                    >
                        Rời khỏi thanh toán?
                    </Text>
                    <Text
                        style={[
                            tw`text-center mb-5`,
                            { color: colors.text.secondary, fontSize: 14 },
                        ]}
                    >
                        Nếu bạn đã thanh toán xong, hãy chờ vài giây để hệ thống cập nhật.
                    </Text>
                    <View style={tw`flex-row`}>
                        <TouchableOpacity
                            onPress={() => setLeaveModalVisible(false)}
                            activeOpacity={0.8}
                            style={[
                                tw`flex-1 mr-2 rounded-xl py-3 items-center`,
                                {
                                    borderWidth: 1,
                                    borderColor: colors.border.main,
                                    backgroundColor: colors.background.paper,
                                },
                            ]}
                        >
                            <Text style={[tw`font-semibold`, { color: colors.text.secondary }]}>
                                Ở lại
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setPollEnabled(false);
                                setLeaveModalVisible(false);
                                navigation.goBack();
                            }}
                            activeOpacity={0.8}
                            style={[
                                tw`flex-1 rounded-xl py-3 items-center`,
                                { backgroundColor: colors.error.main },
                            ]}
                        >
                            <Text style={[tw`font-semibold`, { color: colors.text.white }]}>
                                Rời khỏi
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
};

export default PaymentWebViewScreen;
