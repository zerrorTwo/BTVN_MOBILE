import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator } from "react-native-paper";
import { useSelector } from "react-redux";
import tw from "twrnc";
import { MotiView } from "moti";
import { OrderCard } from "../components/OrderCard";
import { EmptyState } from "../components/EmptyState";
import { OrderCardSkeleton } from "../components/Skeleton";
import { useGetOrdersQuery } from "../services/api/orderApi";
import type { RootState } from "../store";
import { colors } from "../theme";

type OrderStatus =
    | "ALL"
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPING"
    | "COMPLETED"
    | "CANCELLED"
    | "CANCEL_REQUESTED";

const TABS: { label: string; value: OrderStatus }[] = [
    { label: "Tất cả", value: "ALL" },
    { label: "Chờ xác nhận", value: "PENDING" },
    { label: "Đã xác nhận", value: "CONFIRMED" },
    { label: "Đang giao", value: "SHIPPING" },
    { label: "Hoàn thành", value: "COMPLETED" },
    { label: "Yêu cầu hủy", value: "CANCEL_REQUESTED" },
    { label: "Đã hủy", value: "CANCELLED" },
];

export const OrdersScreen = ({ navigation }: any) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [page, setPage] = useState(1);
    const [selectedTab, setSelectedTab] = useState<OrderStatus>("ALL");
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const { data, isLoading, refetch, isFetching } = useGetOrdersQuery(
        { page, limit: 10 },
        { skip: !user },
    );
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (data?.data) {
            const newOrders = data.data;
            if (page === 1) {
                setAllOrders(newOrders);
            } else {
                setAllOrders((prev) => {
                    const existingIds = new Set(prev.map((o: any) => o.id));
                    const uniqueNew = newOrders.filter(
                        (o: any) => !existingIds.has(o.id),
                    );
                    return [...prev, ...uniqueNew];
                });
            }
        }
    }, [data, page]);

    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            setPage(1);
            refetch();
        }, [refetch, user]),
    );

    const onRefresh = useCallback(async () => {
        if (!user) return;
        setRefreshing(true);
        try {
            // Do not clear local list before new response arrives.
            // Otherwise UI may flash "empty" on slow network.
            setPage(1);
            await refetch();
        } finally {
            setRefreshing(false);
        }
    }, [refetch, user]);

    const handleLoadMore = () => {
        if (data && page < data.pagination.totalPages && !isFetching) {
            setPage((prev) => prev + 1);
        }
    };

    const filteredOrders = allOrders.filter((order: any) =>
        selectedTab === "ALL" ? true : order.status === selectedTab,
    );

    if (!user) {
        return (
            <SafeAreaView
                style={[tw`flex-1`, { backgroundColor: colors.background.default }]}
                edges={["bottom"]}
            >
                <EmptyState
                    iconName="lock-closed-outline"
                    title="Đăng nhập để xem đơn hàng"
                    message="Bạn cần đăng nhập để theo dõi đơn hàng của mình"
                    buttonText="Đăng nhập ngay"
                    onButtonPress={() => navigation.navigate("Login")}
                />
            </SafeAreaView>
        );
    }

    const renderTabs = () => (
        <View style={{ backgroundColor: colors.background.paper }}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={TABS}
                keyExtractor={(item) => item.value}
                contentContainerStyle={tw`px-2 py-2`}
                renderItem={({ item }) => {
                    const active = selectedTab === item.value;
                    return (
                        <TouchableOpacity
                            onPress={() => setSelectedTab(item.value)}
                            style={[
                                tw`px-4 py-2 mr-2 rounded-full`,
                                {
                                    backgroundColor: active
                                        ? colors.primary.main
                                        : colors.background.default,
                                },
                            ]}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    tw`font-semibold text-sm`,
                                    { color: active ? "#fff" : colors.text.secondary },
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );

    return (
        <SafeAreaView
            style={[tw`flex-1`, { backgroundColor: colors.background.default }]}
            edges={["bottom"]}
        >
            {renderTabs()}

            {isLoading ? (
                <View style={tw`p-4`}>
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item: any) => item.id.toString()}
                    renderItem={({ item, index }: any) => (
                        <OrderCard
                            order={item}
                            onPress={(orderId) =>
                                navigation.navigate("OrderDetail", { orderId })
                            }
                            index={index}
                        />
                    )}
                    contentContainerStyle={
                        filteredOrders.length === 0 ? tw`flex-1` : tw`p-4`
                    }
                    ListEmptyComponent={
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ type: "timing", duration: 300 }}
                            style={tw`flex-1`}
                        >
                            <EmptyState
                                iconName="receipt-outline"
                                title="Chưa có đơn hàng"
                                message={
                                    selectedTab === "ALL"
                                        ? "Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!"
                                        : `Không có đơn hàng ${TABS.find((t) => t.value === selectedTab)?.label.toLowerCase()}`
                                }
                                buttonText="Mua sắm ngay"
                                onButtonPress={() =>
                                    navigation.navigate("Home", { screen: "HomeTab" })
                                }
                            />
                        </MotiView>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary.main}
                            colors={[colors.primary.main]}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetching && !isLoading ? (
                            <View style={tw`py-4`}>
                                <ActivityIndicator size="small" color={colors.primary.main} />
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
};
