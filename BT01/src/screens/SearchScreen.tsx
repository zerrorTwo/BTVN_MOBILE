import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { Text, Searchbar, Chip, Card, ActivityIndicator, IconButton, Menu, Divider } from 'react-native-paper';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSelector } from 'react-redux';
import {
    useGetProductsQuery,
    useGetCategoriesQuery,
    ProductListItem,
    ProductQueryParams,
} from '../services/api/productApi';
import { useAddToCartMutation } from '../services/api/cartApi';
import Layout from '../components/Layout';
import type { RootState } from '../store';
import { useFlyToCart } from '../hooks/useFlyToCart';
import { getProductImage } from '../utils/image';

const SORT_OPTIONS = [
    { label: 'Mới nhất', value: 'createdAt', order: 'desc' as const },
    { label: 'Giá thấp đến cao', value: 'price', order: 'asc' as const },
    { label: 'Giá cao đến thấp', value: 'price', order: 'desc' as const },
    { label: 'Bán chạy', value: 'sold', order: 'desc' as const },
    { label: 'Đánh giá cao', value: 'rating', order: 'desc' as const },
];
const SEARCH_DEBOUNCE_MS = 400;

export default function SearchScreen({ navigation, route }: any) {
    const { user } = useSelector((state: RootState) => state.auth);
    const [searchText, setSearchText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [sortMenuVisible, setSortMenuVisible] = useState(false);
    const [selectedSort, setSelectedSort] = useState(0);
    const [page, setPage] = useState(1);
    const [accumulatedProducts, setAccumulatedProducts] = useState<ProductListItem[]>([]);
    const pendingAddToCartIds = React.useRef<Set<number>>(new Set());
    const lastAddToCartAt = React.useRef<Record<number, number>>({});

    useEffect(() => {
        const categoryId = route?.params?.categoryId;
        if (categoryId != null) {
            setSelectedCategory(categoryId);
            setPage(1);
            setAccumulatedProducts([]);
        }
    }, [route?.params?.categoryId]);

    useEffect(() => {
        const sortBy = route?.params?.sortBy;
        if (!sortBy) return;

        const sortIndex = SORT_OPTIONS.findIndex(option => option.value === sortBy);
        if (sortIndex >= 0) {
            setSelectedSort(sortIndex);
            setPage(1);
            setAccumulatedProducts([]);
        }
    }, [route?.params?.sortBy]);

    const queryParams: ProductQueryParams = {
        page,
        limit: 10,
        search: searchQuery || undefined,
        categoryId: selectedCategory ?? undefined,
        sortBy: SORT_OPTIONS[selectedSort].value as ProductQueryParams['sortBy'],
        sortOrder: SORT_OPTIONS[selectedSort].order,
    };

    const { data: productsData, isLoading, isFetching, refetch } = useGetProductsQuery(queryParams);
    const { data: categoriesData } = useGetCategoriesQuery();
    const [addToCart] = useAddToCartMutation();
    const { triggerFlyToCart, FlyToCartOverlay } = useFlyToCart();

    useEffect(() => {
        if (productsData?.data?.products) {
            const newProducts = productsData.data.products;
            if (page === 1) {
                setAccumulatedProducts(newProducts);
            } else {
                setAccumulatedProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
            }
        }
    }, [productsData, page]);

    const categories = categoriesData?.categories || [];

    const allProducts = useMemo(() => {
        if (page === 1 && productsData?.data?.products && accumulatedProducts.length === 0) {
            return productsData.data.products;
        }
        return accumulatedProducts;
    }, [accumulatedProducts, productsData, page]);

    useEffect(() => {
        if (searchText === searchQuery) return;

        const debounceTimer = setTimeout(() => {
            setSearchQuery(searchText);
            setPage(1);
            setAccumulatedProducts([]);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(debounceTimer);
    }, [searchText, searchQuery]);

    const handleSearch = useCallback((value?: string) => {
        const nextQuery = value ?? searchText;
        setSearchText(nextQuery);
        if (nextQuery === searchQuery) return;
        setSearchQuery(nextQuery);
        setPage(1);
        setAccumulatedProducts([]);
    }, [searchText, searchQuery]);

    const handleCategorySelect = useCallback((categoryId: number | null) => {
        setSelectedCategory(categoryId);
        setPage(1);
        setAccumulatedProducts([]);
        setTimeout(() => refetch(), 0);
    }, [refetch]);

    const handleSortSelect = useCallback((index: number) => {
        setSelectedSort(index);
        setSortMenuVisible(false);
        setPage(1);
        setAccumulatedProducts([]);
    }, []);

    const handleRefresh = useCallback(async () => {
        setPage(1);
        setAccumulatedProducts([]);
        refetch();
    }, [refetch]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const handleQuickAddToCart = useCallback(async (productId: number) => {
        const now = Date.now();
        const lastAt = lastAddToCartAt.current[productId] || 0;
        if (pendingAddToCartIds.current.has(productId) || now - lastAt < 900) {
            return;
        }

        if (!user) {
            navigation.navigate('Login');
            return;
        }

        pendingAddToCartIds.current.add(productId);
        lastAddToCartAt.current[productId] = now;
        try {
            await addToCart({ productId, quantity: 1 }).unwrap();
        } catch (error: any) {
            Alert.alert('Lỗi', error.data?.message || 'Không thể thêm vào giỏ hàng');
        } finally {
            pendingAddToCartIds.current.delete(productId);
        }
    }, [addToCart, navigation, user]);

    const handleQuickAddToCartWithFly = useCallback(
        async (
            productId: number,
            start: { x: number; y: number; image?: string | null },
        ) => {
            triggerFlyToCart(start);
            await handleQuickAddToCart(productId);
        },
        [handleQuickAddToCart, triggerFlyToCart],
    );

    const renderProductItem = ({ item }: { item: ProductListItem }) => (
        <TouchableOpacity
            style={tw`w-1/2 p-1`}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        >
            <Card style={tw`bg-white rounded-xl`} elevation={2}>
                <Image
                    source={{ uri: getProductImage(item.image) }}
                    style={tw`w-full h-40 rounded-t-xl`}
                    resizeMode="cover"
                />
                <Card.Content style={tw`p-3`}>
                    <Text numberOfLines={2} style={tw`text-gray-800 font-medium text-sm h-10`}>
                        {item.name}
                    </Text>
                    <View style={tw`mt-0.5`}>
                        <Text style={tw`text-red-600 font-bold text-base`}>
                            {formatPrice(item.price)}
                        </Text>
                        <Text
                            style={[
                                tw`text-gray-400 text-xs mt-0.5`,
                                item.originalPrice && item.originalPrice > item.price
                                    ? tw`line-through`
                                    : tw`opacity-0`,
                            ]}
                        >
                            {item.originalPrice && item.originalPrice > item.price
                                ? formatPrice(item.originalPrice)
                                : '0'}
                        </Text>
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
                    <View style={tw`items-end mt-1`}>
                        <IconButton
                            icon="cart-plus"
                            size={20}
                            iconColor="#EE4D2D"
                            style={tw`m-0 bg-orange-50`}
                            onPress={(e) =>
                                handleQuickAddToCartWithFly(item.id, {
                                    x: e.nativeEvent.pageX,
                                    y: e.nativeEvent.pageY,
                                    image: item.image,
                                })
                            }
                        />
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    const renderEmpty = () => {
        if (isLoading || isFetching) {
            return (
                <View style={tw`items-center justify-center py-20`}>
                    <ActivityIndicator size="large" color="#0B5ED7" />
                    <Text style={tw`text-gray-500 mt-4`}>Đang tải sản phẩm...</Text>
                </View>
            );
        }
        return (
            <View style={tw`items-center justify-center py-20`}>
                <Text style={tw`text-6xl mb-4`}>📦</Text>
                <Text style={tw`text-gray-800 text-lg font-bold`}>Không tìm thấy sản phẩm</Text>
                <Text style={tw`text-gray-500 text-sm mt-1`}>Hãy thử tìm kiếm với từ khóa khác</Text>
            </View>
        );
    };

    const renderFooter = () => {
        if (!isFetching || isLoading) return null;
        return (
            <View style={tw`py-4 items-center`}>
                <ActivityIndicator size="small" color="#0B5ED7" />
                <Text style={tw`text-gray-400 text-xs mt-1`}>Đang tải thêm...</Text>
            </View>
        );
    };

    return (
        <Layout>
            <SafeAreaView style={tw`flex-1 bg-[#0B5ED7]`} edges={['top']}>
                <StatusBar style="light" backgroundColor="#0B5ED7" />
                {/* Search and Filters Header - Fixed at top to prevent focus loss */}
                <View style={tw`bg-[#0B5ED7] px-1 pb-2`}>
                    <Searchbar
                        placeholder="Tìm kiếm sản phẩm..."
                        onChangeText={setSearchText}
                        onIconPress={() => handleSearch()}
                        onSubmitEditing={() => handleSearch()}
                        value={searchText}
                        style={tw`bg-white rounded-xl mx-4 mt-4`}
                        iconColor="#0B5ED7"
                    />

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
                                style={tw`mr-2 ${selectedCategory === item.id ? 'bg-[#0B5ED7]' : 'bg-white'}`}
                                textStyle={tw`${selectedCategory === item.id ? 'text-white' : 'text-gray-700'}`}
                            >
                                {item.name}
                            </Chip>
                        )}
                    />

                    <View style={tw`flex-row items-center justify-between px-4 pb-2`}>
                        <Text style={tw`text-white text-sm`}>
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
                    <Divider style={tw`bg-white/30`} />
                </View>

                <FlatList
                    data={allProducts}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => String(item.id)}
                    numColumns={2}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    contentContainerStyle={tw`pb-20 px-2 pt-3`}
                    style={tw`flex-1 bg-gray-100`}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching && page === 1 && !isLoading}
                            onRefresh={handleRefresh}
                            colors={['#0B5ED7']}
                        />
                    }
                    onEndReached={() => {
                        const pagination = productsData?.data?.pagination;
                        if (pagination && page < pagination.totalPages && !isFetching) {
                            setPage(prev => prev + 1);
                        }
                    }}
                    onEndReachedThreshold={0.3}
                />
                {FlyToCartOverlay}
            </SafeAreaView>
        </Layout>
    );
}
