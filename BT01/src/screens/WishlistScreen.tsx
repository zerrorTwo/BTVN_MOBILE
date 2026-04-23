import React, { useEffect, useMemo, useState } from "react";
import { DeviceEventEmitter, FlatList, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, Card, IconButton, Text } from "react-native-paper";
import tw from "twrnc";
import Layout from "../components/Layout";
import { useGetProductsQuery } from "../services/api/productApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const WISHLIST_KEY = "wishlistProductIds";

export default function WishlistScreen({ navigation }: any) {
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  const { data, isLoading, refetch } = useGetProductsQuery({
    page: 1,
    limit: 100,
  });

  const products = data?.data?.products || [];

  const wishlistProducts = useMemo(
    () => products.filter((item) => wishlistIds.includes(item.id)),
    [products, wishlistIds],
  );

  const loadWishlist = async () => {
    const raw = await AsyncStorage.getItem(WISHLIST_KEY);
    setWishlistIds(raw ? JSON.parse(raw) : []);
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "wishlistChanged",
      (count?: number) => {
        if (typeof count === "number") {
          loadWishlist();
        } else {
          loadWishlist();
        }
      },
    );
    loadWishlist();

    return () => sub.remove();
  }, []);

  const removeFromWishlist = async (id: number) => {
    const next = wishlistIds.filter((item) => item !== id);
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    DeviceEventEmitter.emit("wishlistChanged", next.length);
    setWishlistIds(next);
  };

  return (
    <Layout>
      <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["top"]}>
        <StatusBar style="dark" />
        <View style={tw`flex-1 bg-gray-50 px-4 pt-3`}>
        {isLoading ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <Text>Đang tải danh sách yêu thích...</Text>
          </View>
        ) : wishlistProducts.length === 0 ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <Text style={tw`text-lg font-semibold text-gray-700`}>
              Chưa có sản phẩm yêu thích
            </Text>
            <Text style={tw`text-gray-500 mt-2 mb-4 text-center`}>
              Hãy bấm tim ở trang chi tiết để lưu sản phẩm bạn thích.
            </Text>
            <Button
              mode="contained"
              buttonColor="#EE4D2D"
              onPress={() => navigation.navigate("HomeTab")}
            >
              Khám phá sản phẩm
            </Button>
          </View>
        ) : (
          <FlatList
            data={wishlistProducts}
            keyExtractor={(item) => String(item.id)}
            refreshing={isLoading}
            onRefresh={refetch}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ProductDetail", { productId: item.id })
                }
              >
                <Card style={tw`mb-3 rounded-xl`}>
                  <Card.Title
                    title={item.name}
                    subtitle={new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(item.price)}
                    right={() => (
                      <IconButton
                        icon="heart"
                        iconColor="#EE4D2D"
                        onPress={() => removeFromWishlist(item.id)}
                      />
                    )}
                  />
                </Card>
              </TouchableOpacity>
            )}
          />
        )}
        </View>
      </SafeAreaView>
    </Layout>
  );
}
