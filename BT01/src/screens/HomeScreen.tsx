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
  const dispatch = useDispatch();

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

  const handleLogout = () => {
    dispatch(logout());
    navigation.replace('Login');
  };

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
              colors={['#EE4D2D']}
              tintColor="#EE4D2D"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <HomeHeader
            userName={user?.name || 'Khách'}
            isAuthenticated={!!user}
            onNotificationPress={() => { }}
            onProfilePress={() => navigation.navigate('ProfileTab' as any)}
            onLoginPress={() => navigation.navigate('Login')}
            onSearchPress={() => navigation.navigate('SearchTab' as any)}
          />

          {/* Content */}
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
                iconColor="#f97316"
                onSeeAll={() => navigation.navigate('Search', { sortBy: 'sold' })}
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
                iconColor="#ef4444"
              />
              {discountedLoading ? (
                <View style={tw`py-8 items-center`}>
                  <ActivityIndicator size="large" color="#ef4444" />
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
                    contentContainerStyle={tw`px-3`}
                    columnWrapperStyle={tw`justify-between`}
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
