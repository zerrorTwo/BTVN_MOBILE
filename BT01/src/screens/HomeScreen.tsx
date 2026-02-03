import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
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
    navigation.navigate('Search', { categoryId });
  };

  // Unauthenticated state
  if (!user) {
    return (
      <Layout>
        <View style={tw`flex-1 justify-center items-center bg-gray-100 p-4`}>
          <Card style={tw`w-full bg-white rounded-2xl`} elevation={4}>
            <Card.Content style={tw`items-center p-6`}>
              <Avatar.Icon
                size={64}
                icon="alert-circle-outline"
                style={tw`bg-red-100 mb-4`}
                color="#dc2626"
              />
              <Text style={tw`text-xl font-bold text-gray-800 mb-2`}>
                Authentication Error
              </Text>
              <Text style={tw`text-gray-500 text-center mb-6`}>
                We couldn't load your profile. Please try logging in again.
              </Text>
              <TouchableOpacity
                onPress={handleLogout}
                style={tw`w-full bg-indigo-600 py-3 rounded-full`}
              >
                <Text style={tw`text-white text-center font-bold`}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      </Layout>
    );
  }

  const categories = categoriesData?.categories || [];
  const bestSellers = bestSellersData?.products || [];
  const discountedProducts = discountedData?.products || [];

  return (
    <Layout>
      <ScrollView
        style={tw`flex-1 bg-gray-50`}
        contentContainerStyle={tw`pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <HomeHeader
          userName={user.name}
          onNotificationPress={() => { }}
          onProfilePress={() => navigation.navigate('Profile')}
          onSearchPress={() => navigation.navigate('Search')}
        />

        {/* Content */}
        <View style={tw`-mt-8`}>
          {/* Categories Section */}
          <View style={tw`mb-6`}>
            <SectionHeader
              title="Danh mục"
              subtitle="Khám phá theo danh mục"
              icon="shape"
              iconColor="#6366f1"
            />
            {categoriesLoading ? (
              <View style={tw`flex-row justify-center py-4`}>
                <ActivityIndicator size="small" color="#6366f1" />
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
          <View style={tw`mb-6`}>
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
              <View style={tw`px-2`}>
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
                  contentContainerStyle={tw`px-1`}
                  ListEmptyComponent={
                    <View style={tw`py-8 items-center`}>
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

          {/* Logout Button */}
          <View style={tw`px-4 mt-4`}>
            <TouchableOpacity
              onPress={handleLogout}
              style={tw`border-2 border-red-200 bg-white py-3 rounded-xl flex-row items-center justify-center`}
            >
              <IconButton
                icon="logout"
                size={20}
                iconColor="#dc2626"
                style={tw`m-0 p-0`}
              />
              <Text style={tw`text-red-600 font-semibold ml-2`}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>

          <Text style={tw`text-center text-gray-400 text-xs mt-4 mb-2`}>
            App Version 1.0.0 • BT01
          </Text>
        </View>
      </ScrollView>
    </Layout>
  );
}
