import React, { useMemo } from "react";
import { FlatList, View } from "react-native";
import { Card, Text } from "react-native-paper";
import tw from "twrnc";
import Layout from "../components/Layout";
import { useGetOrdersQuery } from "../services/api/orderApi";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

export default function NotificationsScreen() {
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
      <View style={tw`flex-1 bg-gray-50 p-4`}>
        {!isAuthenticated ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <Text style={tw`text-lg font-semibold text-gray-700`}>
              Đăng nhập để xem thông báo
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <Text style={tw`text-lg font-semibold text-gray-700`}>
              Chưa có thông báo
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
    </Layout>
  );
}
