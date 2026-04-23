import React from 'react';
import {
  View,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Card } from 'react-native-paper';
import { useSelector } from 'react-redux';
import tw from 'twrnc';
import { StatusBar } from 'expo-status-bar';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
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
      <SafeAreaView style={tw`flex-1 bg-[#0B5ED7]`} edges={['top']}>
        <StatusBar style="light" backgroundColor="#0B5ED7" />
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
              colors={['#0B5ED7']}
              tintColor="#0B5ED7"
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
            <View style={tw`px-4 mb-5`}>
              <Card style={tw`rounded-2xl bg-[#eaf3ff]`} elevation={0}>
                <Card.Content style={tw`py-3`}>
                  <Text style={tw`text-[#0059c9] font-bold text-base`}>
                    Mega Sale công nghệ
                  </Text>
                  <Text style={tw`text-[#1f2937] text-xs mt-1`}>
                    Ưu đãi laptop, gear và phụ kiện chính hãng mỗi ngày
                  </Text>
                </Card.Content>
              </Card>
            </View>
            {/* Categories Section */}
            <View style={tw`mb-6`}>
              <SectionHeader
                title="Danh mục"
                subtitle="Khám phá theo danh mục"
                icon="shape"
                iconColor="#0059c9"
              />
              {categoriesLoading ? (
                <View style={tw`px-4 py-2`}>
                  <SkeletonPlaceholder speed={0}>
                    <View style={tw`flex-row`}>
                      {[1, 2, 3, 4].map((item) => (
                        <View key={item} style={{ width: 90, marginRight: 10 }}>
                          <View style={{ width: 90, height: 90, borderRadius: 16 }} />
                        </View>
                      ))}
                    </View>
                  </SkeletonPlaceholder>
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
                iconColor="#0059c9"
                onSeeAll={() =>
                  navigation.navigate('Home', {
                    screen: 'SearchTab',
                    params: { sortBy: 'sold' },
                  })
                }
              />
              {bestSellersLoading ? (
                <View style={tw`px-4 py-2`}>
                  <SkeletonPlaceholder speed={0}>
                    <View style={tw`flex-row`}>
                      {[1, 2].map((item) => (
                        <View key={item} style={{ width: 260, marginRight: 10 }}>
                          <View style={{ width: 260, height: 110, borderRadius: 14 }} />
                        </View>
                      ))}
                    </View>
                  </SkeletonPlaceholder>
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
                iconColor="#0059c9"
              />
              {discountedLoading ? (
                <View style={tw`px-4 py-2`}>
                  <SkeletonPlaceholder speed={0}>
                    <View style={tw`flex-row justify-between`}>
                      <View style={{ width: '48%', height: 220, borderRadius: 16 }} />
                      <View style={{ width: '48%', height: 220, borderRadius: 16 }} />
                    </View>
                  </SkeletonPlaceholder>
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
