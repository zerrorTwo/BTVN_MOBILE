import React, { useEffect, useMemo, useState } from "react";
import { DeviceEventEmitter, ScrollView, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, Card, IconButton, Text } from "react-native-paper";
import tw from "twrnc";
import Layout from "../components/Layout";
import { useGetProductsQuery } from "../services/api/productApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const COMPARE_KEY = "compareProductIds";
const MAX_COMPARE = 3;

export default function CompareScreen({ navigation }: any) {
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const { data, isLoading } = useGetProductsQuery({ page: 1, limit: 100 });

  const products = data?.data?.products || [];
  const compareProducts = useMemo(
    () => products.filter((item) => compareIds.includes(item.id)).slice(0, 3),
    [compareIds, products],
  );

  const loadCompareIds = async () => {
    const raw = await AsyncStorage.getItem(COMPARE_KEY);
    setCompareIds(raw ? JSON.parse(raw) : []);
  };

  useEffect(() => {
    loadCompareIds();
  }, []);

  const removeFromCompare = async (id: number) => {
    const next = compareIds.filter((item) => item !== id);
    await AsyncStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    DeviceEventEmitter.emit("compareChanged", next.length);
    setCompareIds(next);
  };

  const clearCompare = async () => {
    await AsyncStorage.setItem(COMPARE_KEY, JSON.stringify([]));
    DeviceEventEmitter.emit("compareChanged", 0);
    setCompareIds([]);
  };

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
          <Text style={tw`text-lg font-semibold text-gray-900 text-center`}>So sánh sản phẩm</Text>
          <View style={tw`w-[40px]`} />
        </View>

        <ScrollView style={tw`flex-1 bg-gray-50 p-4`}>
          <Text style={tw`text-lg font-bold text-gray-800 mb-2`}>
            So sánh sản phẩm ({compareProducts.length}/{MAX_COMPARE})
          </Text>
          <Text style={tw`text-gray-500 mb-4`}>
            Chọn tối đa 3 sản phẩm để so sánh nhanh giá và thông tin cơ bản.
          </Text>

          {isLoading ? (
            <View style={tw`py-8 items-center`}>
              <Text style={tw`text-gray-500`}>Đang tải dữ liệu so sánh...</Text>
            </View>
          ) : compareProducts.length === 0 ? (
            <Card style={tw`rounded-xl`}>
              <Card.Content>
                <Text style={tw`text-base font-semibold text-gray-700`}>
                  Danh sách so sánh đang trống
                </Text>
                <Text style={tw`text-gray-500 mt-1`}>
                  Mở trang chi tiết sản phẩm và bấm "So sánh".
                </Text>
                <Button
                  mode="contained"
                  buttonColor="#0B5ED7"
                  style={tw`mt-4`}
                  onPress={() => navigation.navigate("Home", { screen: "HomeTab" })}
                >
                  Khám phá sản phẩm
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <View>
              <Button mode="outlined" onPress={clearCompare} style={tw`mb-3`}>
                Xóa danh sách so sánh
              </Button>
              {compareProducts.map((item) => (
                <Card key={item.id} style={tw`rounded-xl mb-3`}>
                  <Card.Title
                    title={item.name}
                    subtitle={`Giá: ${new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(item.price)}`}
                    right={() => (
                      <IconButton
                        icon="close"
                        onPress={() => removeFromCompare(item.id)}
                      />
                    )}
                  />
                  <Card.Content>
                    <Text>Đánh giá: {item.rating.toFixed(1)}</Text>
                    <Text>Đã bán: {item.sold}</Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
}
