import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Avatar, IconButton } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import tw from 'twrnc';
import { logout } from '../store/authSlice';
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
} from '../services/api/productApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useSelector((state: RootState) => state.auth);

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
  } = useGetBestSellersQuery(10);

  const {
    data: discountedData,
    isLoading: discountedLoading,
    refetch: refetchDiscounted,
  } = useGetDiscountedProductsQuery(20);

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

  const handleProductPress = (productId: number) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleCategoryPress = (categoryId: number) => {
    navigation.navigate('Home', { screen: 'SearchTab', params: { categoryId } });
  };

  const categories = categoriesData?.categories || [];
  const bestSellers = bestSellersData?.products || [];
  const discountedProducts = discountedData?.products || [];

  return (
    <Layout>
      <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={['top']}>
        <ScrollView
          style={tw`flex-1`}
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
        >
          {/* Header */}
          <HomeHeader
            userName={user?.name || 'Khách'}
            isAuthenticated={!!user}
            onNotificationPress={() => navigation.navigate('Notifications')}
            onProfilePress={() => navigation.navigate('ProfileTab' as any)}
            onLoginPress={() => navigation.navigate('Login')}
            onSearchPress={() => navigation.navigate('SearchTab' as any)}
          />

          {/* Content */}
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
                  <SkeletonPlaceholder>
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
                  data={categories}
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
                onSeeAll={() => navigation.navigate('Search', { sortBy: 'sold' })}
              />
              {bestSellersLoading ? (
                <View style={tw`px-4 py-2`}>
                  <SkeletonPlaceholder>
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
                    />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`px-2`}
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
                  <SkeletonPlaceholder>
                    <View style={tw`flex-row justify-between`}>
                      <View style={{ width: '48%', height: 220, borderRadius: 16 }} />
                      <View style={{ width: '48%', height: 220, borderRadius: 16 }} />
                    </View>
                  </SkeletonPlaceholder>
                </View>
              ) : (
                <View>
                  <FlatList
                    data={discountedProducts}
                    keyExtractor={(item) => `disc-${item.id}`}
                    renderItem={({ item }) => (
                      <GridProductCard
                        item={item}
                        onPress={() => handleProductPress(item.id)}
                      />
                    )}
                    numColumns={2}
                    scrollEnabled={false}
                    contentContainerStyle={tw`px-4`}
                    columnWrapperStyle={tw`justify-between mb-2`}
                    ListEmptyComponent={
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
                    }
                  />
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
}
