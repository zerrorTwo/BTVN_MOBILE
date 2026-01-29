import React, { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, Card, ActivityIndicator, IconButton, Menu, Divider } from 'react-native-paper';
import tw from 'twrnc';
import {
    useGetProductsQuery,
    useGetCategoriesQuery,
    ProductListItem,
    ProductQueryParams,
} from '../services/api/productApi';
import Layout from '../components/Layout';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

const SORT_OPTIONS = [
    { label: 'Mới nhất', value: 'createdAt', order: 'desc' as const },
    { label: 'Giá thấp đến cao', value: 'price', order: 'asc' as const },
    { label: 'Giá cao đến thấp', value: 'price', order: 'desc' as const },
    { label: 'Bán chạy', value: 'sold', order: 'desc' as const },
    { label: 'Đánh giá cao', value: 'rating', order: 'desc' as const },
];

export default function SearchScreen({ navigation }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [sortMenuVisible, setSortMenuVisible] = useState(false);
    const [selectedSort, setSelectedSort] = useState(0);
    const [page, setPage] = useState(1);

    // Build query params
    const queryParams: ProductQueryParams = {
        page,
        limit: 10,
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        sortBy: SORT_OPTIONS[selectedSort].value as ProductQueryParams['sortBy'],
        sortOrder: SORT_OPTIONS[selectedSort].order,
    };

    const { data: productsData, isLoading, isFetching, refetch } = useGetProductsQuery(queryParams);
    const { data: categoriesData } = useGetCategoriesQuery();

    const products = productsData?.data?.products || [];
    const categories = categoriesData?.categories || [];

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(1);
    }, []);

    const handleCategorySelect = (categoryId: number | null) => {
        setSelectedCategory(categoryId);
        setPage(1);
    };

    const handleSortSelect = (index: number) => {
        setSelectedSort(index);
        setSortMenuVisible(false);
        setPage(1);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const renderProductItem = ({ item }: { item: ProductListItem }) => (
        <TouchableOpacity
            style={tw`w-1/2 p-1`}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        >
            <Card style={tw`bg-white rounded-xl`} elevation={2}>
                <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/200?text=No+Image' }}
                    style={tw`w-full h-40 rounded-t-xl`}
                    resizeMode="cover"
                />
                <Card.Content style={tw`p-3`}>
                    <Text numberOfLines={2} style={tw`text-gray-800 font-medium text-sm h-10`}>
                        {item.name}
                    </Text>
                    <View style={tw`flex-row items-center mt-1`}>
                        <Text style={tw`text-red-600 font-bold text-base`}>
                            {formatPrice(item.price)}
                        </Text>
                        {item.originalPrice && item.originalPrice > item.price && (
                            <Text style={tw`text-gray-400 text-xs line-through ml-2`}>
                                {formatPrice(item.originalPrice)}
                            </Text>
                        )}
                    </View>
                    <View style={tw`flex-row items-center justify-between mt-2`}>
                        <View style={tw`flex-row items-center`}>
                            <Text style={tw`text-yellow-500`}>★</Text>
                            <Text style={tw`text-gray-500 text-xs ml-1`}>
                                {item.rating.toFixed(1)} ({item.ratingCount})
                            </Text>
                        </View>
                        <Text style={tw`text-gray-400 text-xs`}>
                            Đã bán {item.sold}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={tw`pb-2`}>
            {/* Search Bar */}
            <Searchbar
                placeholder="Tìm kiếm sản phẩm..."
                onChangeText={handleSearch}
                value={searchQuery}
                style={tw`bg-white rounded-xl mx-4 mt-4`}
                iconColor="#6366f1"
            />

            {/* Categories */}
            <FlatList
                data={[{ id: null, name: 'Tất cả' }, ...categories]}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={tw`px-4 py-3`}
                renderItem={({ item }) => (
                    <Chip
                        selected={selectedCategory === item.id}
                        onPress={() => handleCategorySelect(item.id)}
                        style={tw`mr-2 ${selectedCategory === item.id ? 'bg-indigo-600' : 'bg-white'}`}
                        textStyle={tw`${selectedCategory === item.id ? 'text-white' : 'text-gray-700'}`}
                    >
                        {item.name}
                    </Chip>
                )}
            />

            {/* Sort & Filter Bar */}
            <View style={tw`flex-row items-center justify-between px-4 pb-2`}>
                <Text style={tw`text-gray-500 text-sm`}>
                    {productsData?.data?.pagination?.total || 0} sản phẩm
                </Text>
                <Menu
                    visible={sortMenuVisible}
                    onDismiss={() => setSortMenuVisible(false)}
                    anchor={
                        <TouchableOpacity
                            style={tw`flex-row items-center bg-white px-3 py-2 rounded-lg`}
                            onPress={() => setSortMenuVisible(true)}
                        >
                            <Text style={tw`text-gray-700 text-sm mr-1`}>
                                {SORT_OPTIONS[selectedSort].label}
                            </Text>
                            <IconButton icon="chevron-down" size={16} iconColor="#374151" style={tw`m-0 p-0`} />
                        </TouchableOpacity>
                    }
                >
                    {SORT_OPTIONS.map((option, index) => (
                        <Menu.Item
                            key={index}
                            onPress={() => handleSortSelect(index)}
                            title={option.label}
                            leadingIcon={selectedSort === index ? 'check' : undefined}
                        />
                    ))}
                </Menu>
            </View>
            <Divider />
        </View>
    );

    const renderEmpty = () => (
        <View style={tw`flex-1 items-center justify-center py-20`}>
            {isLoading ? (
                <ActivityIndicator size="large" color="#6366f1" />
            ) : (
                <>
                    <Text style={tw`text-6xl mb-4`}>🔍</Text>
                    <Text style={tw`text-gray-500 text-lg`}>
                        {searchQuery ? 'Không tìm thấy sản phẩm' : 'Hãy tìm kiếm sản phẩm'}
                    </Text>
                </>
            )}
        </View>
    );

    return (
        <Layout>
            <View style={tw`flex-1 bg-gray-100`}>
                <FlatList
                    data={products}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => String(item.id)}
                    numColumns={2}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={tw`pb-4 px-2`}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching && !isLoading}
                            onRefresh={refetch}
                            colors={['#6366f1']}
                        />
                    }
                    onEndReached={() => {
                        const pagination = productsData?.data?.pagination;
                        if (pagination && page < pagination.totalPages) {
                            setPage(page + 1);
                        }
                    }}
                    onEndReachedThreshold={0.5}
                />
            </View>
        </Layout>
    );
}
