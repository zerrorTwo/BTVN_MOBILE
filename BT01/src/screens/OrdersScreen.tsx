import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button } from 'react-native-paper';
import { useSelector } from 'react-redux';
import tw from 'twrnc';
import { OrderCard } from '../components/OrderCard';
import { useGetOrdersQuery } from '../services/api/orderApi';
import type { RootState } from '../store';

type OrderStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';

export const OrdersScreen = ({ navigation }: any) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [page, setPage] = useState(1);
    const [selectedTab, setSelectedTab] = useState<OrderStatus>('ALL');
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const { data, isLoading, refetch, isFetching } = useGetOrdersQuery(
        { page, limit: 10 },
        { skip: !user }
    );
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (data?.data) {
            const newOrders = data.data;
            if (page === 1) {
                setAllOrders(newOrders);
            } else {
                setAllOrders(prev => {
                    const existingIds = new Set(prev.map((o: any) => o.id));
                    const uniqueNew = newOrders.filter((o: any) => !existingIds.has(o.id));
                    return [...prev, ...uniqueNew];
                });
            }
        }
    }, [data, page]);

    const onRefresh = useCallback(async () => {
        if (!user) return;
        setRefreshing(true);
        setPage(1);
        setAllOrders([]);
        await refetch();
        setRefreshing(false);
    }, [refetch, user]);

    const handleLoadMore = () => {
        if (data && page < data.pagination.totalPages && !isFetching) {
            setPage(prev => prev + 1);
        }
    };

    const handleOrderPress = (orderId: number) => {
        navigation.navigate("OrderDetail", { orderId });
    };

    const handleTabChange = (tab: OrderStatus) => {
        setSelectedTab(tab);
    };

    const tabs = [
        { label: "Tất cả", value: "ALL" },
        { label: "Chờ xác nhận", value: "PENDING" },
        { label: "Đã xác nhận", value: "CONFIRMED" },
        { label: "Đang chuẩn bị", value: "PREPARING" },
        { label: "Đang giao", value: "SHIPPING" },
        { label: "Hoàn thành", value: "COMPLETED" },
        { label: "Đã hủy", value: "CANCELLED" },
    ];

    const filteredOrders = allOrders.filter((order: any) =>
        selectedTab === "ALL" ? true : order.status === selectedTab
    );

    if (!user) {
        return (
            <SafeAreaView style={tw`flex-1 bg-gray-50 justify-center items-center px-6`} edges={["bottom"]}>
                <Text style={tw`text-6xl mb-4`}>🔒</Text>
                <Text style={tw`text-xl font-bold text-gray-800 text-center`}>
                    Đăng nhập để xem đơn hàng
                </Text>
                <Text style={tw`text-sm text-gray-500 mt-2 text-center`}>
                    Bạn cần đăng nhập để theo dõi đơn hàng của mình
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

    const renderEmpty = () => (
        <View style={tw`flex-1 justify-center items-center py-20 px-6`}>
            <Text style={tw`text-6xl mb-4`}>📦</Text>
            <Text style={tw`text-xl font-bold text-gray-800 text-center`}>
                Chưa có đơn hàng
            </Text>
            <Text style={tw`text-sm text-gray-500 mt-2 text-center`}>
                {selectedTab === "ALL"
                    ? "Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!"
                    : `Không có đơn hàng ${tabs.find((t) => t.value === selectedTab)?.label.toLowerCase()}`}
            </Text>
            <Button
                mode="contained"
                onPress={() => navigation.navigate("HomeTab")}
                style={tw`mt-6 rounded-xl`}
                buttonColor="#EE4D2D"
            >
                Mua sắm ngay
            </Button>
        </View>
    );

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["bottom"]}>
            <View style={tw`bg-white`}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={tabs}
                    keyExtractor={(item) => item.value}
                    contentContainerStyle={tw`px-2 py-2`}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => handleTabChange(item.value as OrderStatus)}
                            style={[
                                tw`px-4 py-2 mr-2 rounded-full`,
                                selectedTab === item.value
                                    ? tw`bg-[#EE4D2D]`
                                    : tw`bg-gray-100`,
                            ]}
                        >
                            <Text
                                style={[
                                    tw`font-semibold`,
                                    selectedTab === item.value
                                        ? tw`text-white`
                                        : tw`text-gray-600`,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {isLoading ? (
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#EE4D2D" />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item: any) => item.id.toString()}
                    renderItem={({ item }: any) => (
                        <OrderCard order={item} onPress={handleOrderPress} />
                    )}
                    contentContainerStyle={filteredOrders.length === 0 ? tw`flex-1` : tw`p-4`}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetching && !isLoading ? (
                            <View style={tw`py-4`}>
                                <ActivityIndicator size="small" color="#EE4D2D" />
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
};
