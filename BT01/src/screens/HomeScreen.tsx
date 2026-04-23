import React from 'react';
import {
  View,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { useSelector } from 'react-redux';
import tw from 'twrnc';
import { StatusBar } from 'expo-status-bar';
import {
  Layout,
  CategoryCard,
  HorizontalProductCard,
  GridProductCard,
  SectionHeader,
  HomeHeader,
} from '../components';
import type { RootState } from '../store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  useGetCategoriesQuery,
  useGetBestSellersQuery,
  useGetDiscountedProductsQuery,
  type ProductListItem,
  type DiscountedProduct,
} from '../services/api/productApi';
import { useAddToCartMutation } from '../services/api/cartApi';
import { useFlyToCart } from '../hooks/useFlyToCart';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [categoryVisibleCount, setCategoryVisibleCount] = React.useState(8);
  const [bestSellerLimit, setBestSellerLimit] = React.useState(10);
  const [discountedLimit, setDiscountedLimit] = React.useState(20);
  const [addToCart] = useAddToCartMutation();
  const { triggerFlyToCart, FlyToCartOverlay } = useFlyToCart();
  const pendingAddToCartIds = React.useRef<Set<number>>(new Set());
  const lastAddToCartAt = React.useRef<Record<number, number>>({});

  // API Queries
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  const {
    data: bestSellersData,
    isLoading: bestSellersLoading,
    refetch: refetchBestSellers,
  } = useGetBestSellersQuery(bestSellerLimit);

  const {
    data: discountedData,
    isLoading: discountedLoading,
    refetch: refetchDiscounted,
  } = useGetDiscountedProductsQuery(discountedLimit);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchCategories(),
      refetchBestSellers(),
      refetchDiscounted(),
    ]);
    setRefreshing(false);
  }, [refetchCategories, refetchBestSellers, refetchDiscounted]);

  const handleAddToCart = React.useCallback(
    async (
      item: ProductListItem | DiscountedProduct,
      start: { x: number; y: number; image?: string | null },
    ) => {
      const now = Date.now();
      const lastAt = lastAddToCartAt.current[item.id] || 0;
      if (pendingAddToCartIds.current.has(item.id) || now - lastAt < 900) {
        return;
      }

      if (!user) {
        navigation.navigate('Login');
        return;
      }

      pendingAddToCartIds.current.add(item.id);
      lastAddToCartAt.current[item.id] = now;
      triggerFlyToCart(start);
      try {
        await addToCart({ productId: item.id, quantity: 1 }).unwrap();
      } catch (error: any) {
        Alert.alert('Lỗi', error.data?.message || 'Không thể thêm vào giỏ hàng');
      } finally {
        pendingAddToCartIds.current.delete(item.id);
      }
    },
    [addToCart, navigation, triggerFlyToCart, user],
  );

  const handleProductPress = (productId: number) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleCategoryPress = (categoryId: number) => {
    navigation.navigate('Home', { screen: 'SearchTab', params: { categoryId } });
  };

  const categories = categoriesData?.categories || [];
  const bestSellers = bestSellersData?.products || [];
  const discountedProducts = discountedData?.products || [];
  const visibleCategories = categories.slice(0, categoryVisibleCount);

  return (
    <Layout>
      <SafeAreaView style={tw`flex-1 bg-[#EE4D2D]`} edges={['top']}>
        <StatusBar style="light" backgroundColor="#EE4D2D" />
        <HomeHeader
          userName={user?.name || 'Khách'}
          isAuthenticated={!!user}
          onNotificationPress={() => navigation.navigate('Notifications')}
          onProfilePress={() => navigation.navigate('ProfileTab' as any)}
          onLoginPress={() => navigation.navigate('Login')}
          onSearchPress={() => navigation.navigate('SearchTab' as any)}
        />
        <FlatList
          data={discountedProducts}
          keyExtractor={(item) => `disc-${item.id}`}
          numColumns={2}
          renderItem={({ item }) => (
            <GridProductCard
              item={item}
              onPress={() => handleProductPress(item.id)}
              onAddToCart={handleAddToCart}
            />
          )}
          style={tw`flex-1 bg-gray-50`}
          contentContainerStyle={tw`pb-20`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#EE4D2D']}
              tintColor="#EE4D2D"
            />
          }
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={discountedProducts.length > 1 ? tw`justify-between mb-2` : undefined}
          contentInsetAdjustmentBehavior="automatic"
          onEndReached={() => {
            if (!discountedLoading && discountedProducts.length >= discountedLimit) {
              setDiscountedLimit((prev) => prev + 20);
            }
          }}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={(
            <View style={tw`mt-8`}>
            {/* Categories Section */}
            <View style={tw`mb-6`}>
              <SectionHeader
                title="Danh mục"
                subtitle="Khám phá theo danh mục"
                icon="shape"
                iconColor="#EE4D2D"
              />
              {categoriesLoading ? (
                <View style={tw`flex-row justify-center py-4`}>
                  <ActivityIndicator size="small" color="#EE4D2D" />
                </View>
              ) : (
                <FlatList
                  data={visibleCategories}
                  keyExtractor={(item) => `cat-${item.id}`}
                  renderItem={({ item }) => (
                    <CategoryCard
                      item={item}
                      onPress={() => handleCategoryPress(item.id)}
                    />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`px-2`}
                  onEndReached={() => {
                    if (categoryVisibleCount < categories.length) {
                      setCategoryVisibleCount((prev) => Math.min(prev + 8, categories.length));
                    }
                  }}
                  onEndReachedThreshold={0.4}
                  ListEmptyComponent={
                    <View style={tw`px-4 py-8 items-center`}>
                      <Text style={tw`text-gray-400`}>Không có danh mục</Text>
                    </View>
                  }
                />
              )}
            </View>

            {/* Best Sellers Section */}
            <View style={tw`mb-6`}>
              <SectionHeader
                title="Bán chạy nhất"
                subtitle="Top 10 sản phẩm hot nhất"
                icon="fire"
                iconColor="#f97316"
                onSeeAll={() =>
                  navigation.navigate('Home', {
                    screen: 'SearchTab',
                    params: { sortBy: 'sold' },
                  })
                }
              />
              {bestSellersLoading ? (
                <View style={tw`flex-row justify-center py-4`}>
                  <ActivityIndicator size="small" color="#f97316" />
                </View>
              ) : (
                <FlatList
                  data={bestSellers}
                  keyExtractor={(item) => `best-${item.id}`}
                  renderItem={({ item }) => (
                    <HorizontalProductCard
                      item={item}
                      onPress={() => handleProductPress(item.id)}
                      onAddToCart={handleAddToCart}
                    />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`px-2`}
                  onEndReached={() => {
                    if (!bestSellersLoading && bestSellers.length >= bestSellerLimit) {
                      setBestSellerLimit((prev) => prev + 10);
                    }
                  }}
                  onEndReachedThreshold={0.4}
                  ListEmptyComponent={
                    <View style={tw`px-4 py-8 items-center`}>
                      <Text style={tw`text-gray-400`}>Không có sản phẩm</Text>
                    </View>
                  }
                />
              )}
            </View>

            {/* Discounted Products Section */}
            <View style={tw`mb-6 `}>
              <SectionHeader
                title="Khuyến mãi hot"
                subtitle="20 sản phẩm giảm giá sâu nhất"
                icon="tag-multiple"
                iconColor="#ef4444"
              />
              {discountedLoading ? (
                <View style={tw`py-8 items-center`}>
                  <ActivityIndicator size="large" color="#ef4444" />
                </View>
              ) : null}
            </View>
            </View>
          )}
          ListEmptyComponent={
            !discountedLoading ? (
              <View style={tw`py-8 w-full items-center`}>
                <IconButton
                  icon="tag-off-outline"
                  size={48}
                  iconColor="#d1d5db"
                />
                <Text style={tw`text-gray-400 mt-2`}>
                  Chưa có sản phẩm giảm giá
                </Text>
              </View>
            ) : null
          }
        />
        {FlyToCartOverlay}
      </SafeAreaView>
    </Layout>
  );
}
