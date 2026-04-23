import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, FlatList, Dimensions, DeviceEventEmitter } from 'react-native';
import { Text, Button, Chip, Divider, ActivityIndicator, IconButton, Snackbar } from 'react-native-paper';
import tw from 'twrnc';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetProductByIdQuery } from '../services/api/productApi';
import { useAddToCartMutation } from '../services/api/cartApi';
import Layout from '../components/Layout';
import type { RootState } from '../store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WISHLIST_KEY = 'wishlistProductIds';
const COMPARE_KEY = 'compareProductIds';

export default function ProductDetailScreen({ route, navigation }: Props) {
    const { productId } = route.params;
    const insets = useSafeAreaInsets();
    const [showCompactHeader, setShowCompactHeader] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');

    const { user } = useSelector((state: RootState) => state.auth);
    const { data, isLoading, error } = useGetProductByIdQuery(productId);
    const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
    const product = data?.product;

    useEffect(() => {
        const loadWishlistState = async () => {
            const raw = await AsyncStorage.getItem(WISHLIST_KEY);
            const ids: number[] = raw ? JSON.parse(raw) : [];
            setIsFavorite(ids.includes(productId));
        };

        loadWishlistState();
    }, [productId]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const discount = product?.originalPrice
        ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
        : 0;

    const images = product?.images?.length ? product.images : [product?.image || 'https://via.placeholder.com/400?text=No+Image'];

    const handleAddToCart = async () => {
        if (!user) {
            navigation.navigate('Login');
            return;
        }

        try {
            await addToCart({ productId, quantity }).unwrap();
            setSnackMessage(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
        } catch (error: any) {
            setSnackMessage(error.data?.message || 'Không thể thêm vào giỏ hàng');
        }
    };

    const toggleWishlist = async () => {
        if (!user) {
            setSnackMessage('Vui lòng đăng nhập để thêm sản phẩm yêu thích');
            navigation.navigate('Login');
            return;
        }

        const raw = await AsyncStorage.getItem(WISHLIST_KEY);
        const ids: number[] = raw ? JSON.parse(raw) : [];
        const exists = ids.includes(productId);
        const next = exists ? ids.filter((id) => id !== productId) : [...ids, productId];
        await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
        DeviceEventEmitter.emit('wishlistChanged', next.length);
        setIsFavorite(!exists);
        setSnackMessage(
            exists
                ? `Đã bỏ ${product?.name} khỏi yêu thích`
                : `Đã thêm ${product?.name} vào yêu thích`,
        );
    };

    const addToCompare = async () => {
        const raw = await AsyncStorage.getItem(COMPARE_KEY);
        const ids: number[] = raw ? JSON.parse(raw) : [];

        if (ids.includes(productId)) {
            navigation.navigate('Compare');
            return;
        }

        if (ids.length >= 3) {
            setSnackMessage('Chỉ được so sánh tối đa 3 sản phẩm');
            return;
        }

        const next = [...ids, productId];
        await AsyncStorage.setItem(COMPARE_KEY, JSON.stringify(next));
        DeviceEventEmitter.emit('compareChanged', next.length);
        setSnackMessage(`Đã thêm ${product?.name} vào so sánh`);
    };

    if (isLoading) {
        return (
            <Layout>
                <View style={tw`flex-1 items-center justify-center bg-gray-100`}>
                    <ActivityIndicator size="large" color="#0B5ED7" />
                    <Text style={tw`text-gray-500 mt-4`}>Đang tải sản phẩm...</Text>
                </View>
            </Layout>
        );
    }

    if (error || !product) {
        return (
            <Layout>
                <View style={tw`flex-1 items-center justify-center bg-gray-100`}>
                    <Text style={tw`text-6xl mb-4`}>😢</Text>
                    <Text style={tw`text-gray-700 text-lg font-semibold mb-2`}>Không tìm thấy sản phẩm</Text>
                    <Text style={tw`text-gray-500 text-center px-8`}>
                        Sản phẩm này có thể đã bị xóa hoặc không còn khả dụng.
                    </Text>
                    <Button
                        mode="contained"
                        onPress={() => navigation.goBack()}
                        style={tw`mt-6 rounded-xl`}
                        buttonColor="#0B5ED7"
                    >
                        Quay lại
                    </Button>
                </View>
            </Layout>
        );
    }

    return (
        <Layout>
            <StatusBar style={showCompactHeader ? 'light' : 'dark'} />
            <ScrollView
                style={tw`flex-1 bg-gray-100`}
                onScroll={(event) => {
                    const offsetY = event.nativeEvent.contentOffset.y;
                    setShowCompactHeader(offsetY > 120);
                }}
                scrollEventThrottle={16}
            >
                {/* Image Gallery */}
                <View style={tw`bg-white`}>
                    <FlatList
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                            setCurrentImageIndex(index);
                        }}
                        renderItem={({ item }) => (
                            <Image
                                source={{ uri: item }}
                                style={{ width: SCREEN_WIDTH, height: 260 }}
                                resizeMode="cover"
                            />
                        )}
                        keyExtractor={(_, index) => String(index)}
                    />

                    {/* Image Indicators */}
                    {images.length > 1 && (
                        <View style={tw`flex-row justify-center py-3`}>
                            {images.map((_, index) => (
                                <View
                                    key={index}
                                    style={tw`w-2 h-2 rounded-full mx-1 ${index === currentImageIndex ? 'bg-[#0B5ED7]' : 'bg-gray-300'
                                        }`}
                                />
                            ))}
                        </View>
                    )}

                    {/* Discount Badge */}
                    {discount > 0 && (
                        <View style={tw`absolute left-4 bottom-4 bg-red-500 px-3 py-1 rounded-lg`}>
                            <Text style={tw`text-white font-bold`}>-{discount}%</Text>
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View style={tw`bg-white mt-2 p-4`}>
                    {/* Price */}
                    <View style={tw`flex-row items-center mb-2`}>
                        <Text style={tw`text-red-600 font-bold text-2xl`}>
                            {formatPrice(Number(product.price))}
                        </Text>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <Text style={tw`text-gray-400 text-base line-through ml-3`}>
                                {formatPrice(Number(product.originalPrice))}
                            </Text>
                        )}
                    </View>

                    {/* Name */}
                    <Text style={tw`text-gray-800 text-lg font-semibold mb-2`}>
                        {product.name}
                    </Text>

                    {/* Rating & Sold */}
                    <View style={tw`flex-row items-center`}>
                        <View style={tw`flex-row items-center bg-yellow-50 px-2 py-1 rounded-lg`}>
                            <Text style={tw`text-yellow-600 font-bold`}>★ {Number(product.rating || 0).toFixed(1)}</Text>
                            <Text style={tw`text-gray-500 text-sm ml-1`}>({product.ratingCount || 0})</Text>
                        </View>
                        <Divider style={tw`h-4 w-px bg-gray-300 mx-3`} />
                        <Text style={tw`text-gray-500`}>Đã bán {product.sold || 0}</Text>
                        <Divider style={tw`h-4 w-px bg-gray-300 mx-3`} />
                        <Text style={tw`text-gray-500`}>Kho: {product.stock || 0}</Text>
                    </View>

                    {/* Category */}
                    {(product.category?.name || product.categoryName) && (
                        <View style={tw`flex-row items-center mt-3`}>
                            <Text style={tw`text-gray-500`}>Danh mục: </Text>
                            <Chip compact style={tw`bg-blue-50`} textStyle={tw`text-[#0B5ED7] text-xs`}>
                                {product.category?.name || product.categoryName}
                            </Chip>
                        </View>
                    )}

                    {/* Brand */}
                    {product.brand?.name && (
                        <View style={tw`flex-row items-center mt-3`}>
                            <Text style={tw`text-gray-500 mr-2`}>Thương hiệu:</Text>
                            {product.brand.imageUrl ? (
                                <Image
                                    source={{ uri: product.brand.imageUrl }}
                                    style={tw`w-6 h-6 rounded-full mr-2`}
                                    resizeMode="contain"
                                />
                            ) : null}
                            <Text style={tw`text-gray-700 font-medium`}>{product.brand.name}</Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                <View style={tw`bg-white mt-2 p-4`}>
                    <Text style={tw`text-gray-800 font-semibold text-base mb-3`}>
                        Mô tả sản phẩm
                    </Text>
                    <Text style={tw`text-gray-600 leading-6`}>
                        {product.description || 'Không có mô tả cho sản phẩm này.'}
                    </Text>
                </View>

                {/* Quantity Selector */}
                <View style={tw`bg-white mt-2 p-4`}>
                    <Text style={tw`text-gray-800 font-semibold text-base mb-3`}>
                        Số lượng
                    </Text>
                    <View style={tw`flex-row items-center`}>
                        <TouchableOpacity
                            onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                            style={tw`w-10 h-10 border border-gray-300 rounded-lg items-center justify-center`}
                        >
                            <Text style={tw`text-gray-700 text-xl`}>−</Text>
                        </TouchableOpacity>
                        <Text style={tw`mx-6 text-lg font-semibold`}>{quantity}</Text>
                        <TouchableOpacity
                            onPress={() => quantity < product.stock && setQuantity(quantity + 1)}
                            style={tw`w-10 h-10 border border-gray-300 rounded-lg items-center justify-center`}
                        >
                            <Text style={tw`text-gray-700 text-xl`}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Spacer for bottom button */}
                <View style={{ height: 92 + insets.bottom }} />
            </ScrollView>

            <View
                style={[
                    tw`absolute left-0 right-0 flex-row items-center justify-between px-2`,
                    {
                        top: 0,
                        paddingTop: insets.top + 4,
                        paddingBottom: 8,
                        backgroundColor: showCompactHeader ? '#0B5ED7' : 'transparent',
                    },
                ]}
            >
                <IconButton
                    icon="arrow-left"
                    size={22}
                    iconColor="#FFFFFF"
                    style={[
                        tw`m-0`,
                        showCompactHeader
                            ? { backgroundColor: "rgba(0,0,0,0.16)" }
                            : { backgroundColor: "rgba(0,0,0,0.28)" },
                    ]}
                    onPress={() => navigation.goBack()}
                />
                {showCompactHeader ? (
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={tw`text-white text-base font-semibold text-center flex-1 mx-2`}
                    >
                        {product.name}
                    </Text>
                ) : (
                    <View style={tw`flex-1`} />
                )}
                <View style={tw`w-[40px]`} />
            </View>

            {/* Bottom Action Bar */}
            <View
                style={[
                    tw`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 flex-row items-center`,
                    { paddingBottom: 12 + insets.bottom },
                ]}
            >
                <IconButton
                    icon={isFavorite ? "heart" : "heart-outline"}
                    size={24}
                    iconColor="#0B5ED7"
                    style={tw`w-12 h-12 border border-gray-300 rounded-xl m-0 mr-3`}
                    onPress={toggleWishlist}
                />
                <IconButton
                    icon="compare"
                    size={24}
                    iconColor="#0B5ED7"
                    style={tw`w-12 h-12 border border-[#0B5ED7] rounded-xl m-0 mr-3`}
                    onPress={addToCompare}
                />
                <Button
                    mode="contained"
                    onPress={handleAddToCart}
                    loading={isAddingToCart}
                    disabled={isAddingToCart}
                    icon="cart-plus"
                    style={tw`flex-1 rounded-xl`}
                    buttonColor="#0B5ED7"
                    textColor="#FFFFFF"
                    contentStyle={tw`py-2`}
                >
                    Thêm giỏ • {formatPrice(Number(product.price) * quantity)}
                </Button>
            </View>

            {/* Snackbar Toast */}
            <Snackbar
                visible={!!snackMessage}
                onDismiss={() => setSnackMessage('')}
                duration={2500}
                style={tw`mb-20 bg-gray-800`}
            >
                {snackMessage}
            </Snackbar>
        </Layout>
    );
}
