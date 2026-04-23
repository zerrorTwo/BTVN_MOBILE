import React, { useMemo } from "react";
import { FlatList, View } from "react-native";
import { Card, Text, IconButton } from "react-native-paper";
import tw from "twrnc";
import Layout from "../components/Layout";
import { useGetOrdersQuery } from "../services/api/orderApi";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function NotificationsScreen({ navigation }: any) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { data } = useGetOrdersQuery(
    { page: 1, limit: 10 },
    { skip: !isAuthenticated },
  );

  const notifications = useMemo(() => {
    const orders = data?.data || [];
    return orders.map((order: any) => ({
      id: order.id,
      title: `Đơn #${order.orderCode}`,
      message: `Trạng thái hiện tại: ${order.status}`,
      createdAt: order.updatedAt || order.createdAt,
    }));
  }, [data]);

  return (
    <Layout>
      <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["top"]}>
        <StatusBar style="dark" />
        <View style={tw`flex-row items-center justify-between px-2 py-2 bg-white border-b border-gray-100`}>
          <IconButton
            icon="arrow-left"
            size={22}
            onPress={() => navigation.goBack()}
            iconColor="#111827"
          />
          <Text style={tw`text-lg font-semibold text-gray-900 text-center`}>Thông báo</Text>
          <View style={tw`w-[40px]`} />
        </View>

        <View style={tw`flex-1 p-4`}>
        {!isAuthenticated ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <Text style={tw`text-lg font-semibold text-gray-700`}>
              Đăng nhập để xem thông báo
            </Text>
            <Text
              style={tw`mt-3 text-[#EE4D2D] font-medium`}
              onPress={() => navigation.goBack()}
            >
              Quay lại
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={tw`flex-1 items-center justify-center px-8`}>
            <Text style={tw`text-5xl mb-3`}>🔔</Text>
            <Text style={tw`text-lg font-semibold text-gray-700 text-center w-full`}>
              Chưa có thông báo
            </Text>
            <Text
              style={tw`mt-3 text-[#EE4D2D] font-medium text-center w-full`}
              onPress={() => navigation.goBack()}
            >
              Quay lại
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Card style={tw`mb-3 rounded-xl`}>
                <Card.Content>
                  <Text style={tw`font-semibold text-gray-800`}>
                    {item.title}
                  </Text>
                  <Text style={tw`text-gray-600 mt-1`}>{item.message}</Text>
                  <Text style={tw`text-xs text-gray-400 mt-2`}>
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </Text>
                </Card.Content>
              </Card>
            )}
          />
        )}
        </View>
      </SafeAreaView>
    </Layout>
  );
}
