import React, { useEffect } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Card, Text } from "react-native-paper";
import tw from "twrnc";
import Layout from "../components/Layout";
import { useGetOrderByIdQuery } from "../services/api/orderApi";
import { OrderTimeline } from "../components/OrderTimeline";

export default function OrderTrackingScreen({ route }: any) {
  const { orderId } = route.params;
  const { data, isLoading, refetch } = useGetOrderByIdQuery(orderId);
  const order = data?.data;

  useEffect(() => {
    const timer = setInterval(() => {
      refetch();
    }, 10000);

    return () => clearInterval(timer);
  }, [refetch]);

  if (isLoading) {
    return (
      <Layout>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator />
          <Text style={tw`mt-2 text-gray-500`}>Đang tải trạng thái đơn...</Text>
        </View>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <View style={tw`flex-1 items-center justify-center`}>
          <Text>Không tìm thấy đơn hàng</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollView style={tw`flex-1 bg-gray-50 p-4`}>
        <Card style={tw`rounded-xl mb-3`}>
          <Card.Content>
            <Text style={tw`text-lg font-bold text-gray-800`}>
              Theo dõi đơn #{order.orderCode}
            </Text>
            <Text style={tw`text-gray-500 mt-1`}>
              Cập nhật tự động mỗi 10 giây
            </Text>
          </Card.Content>
        </Card>

        <OrderTimeline currentStatus={order.status} createdAt={order.createdAt} />
      </ScrollView>
    </Layout>
  );
}
