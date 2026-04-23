import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { DeviceEventEmitter } from 'react-native';
import { colors, shadows } from '../theme';
import type { RootState } from '../store';
import HomeScreen from '../screens/HomeScreen';
import { CartScreen } from '../screens/CartScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import { useGetCartQuery } from '../services/api/cartApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [wishlistCount, setWishlistCount] = React.useState<number>(0);

    // Fetch data for badges
    const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });

    React.useEffect(() => {
        const loadWishlistCount = async () => {
            const raw = await AsyncStorage.getItem('wishlistProductIds');
            const ids: number[] = raw ? JSON.parse(raw) : [];
            setWishlistCount(ids.length);
        };

        const sub = DeviceEventEmitter.addListener('wishlistChanged', (count?: number) => {
            if (typeof count === 'number') {
                setWishlistCount(count);
            } else {
                loadWishlistCount();
            }
        });

        loadWishlistCount();
        return () => sub.remove();
    }, []);

    const cartBadge = useMemo(() => {
        const count = cartData?.data?.itemCount || 0;
        return count > 0 ? count : undefined;
    }, [cartData]);

    const wishlistBadge = useMemo(
        () => (wishlistCount > 0 ? wishlistCount : undefined),
        [wishlistCount],
    );

    return (
        <Tab.Navigator
            screenOptions={({ route }: any) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }: any) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'SearchTab') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'WishlistTab') {
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'CartTab') {
                        iconName = focused ? 'cart' : 'cart-outline';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary.main,
                tabBarInactiveTintColor: colors.text.secondary,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 20,
                    right: 20,
                    height: 80,
                    borderRadius: 16,
                    backgroundColor: colors.background.paper,
                    paddingBottom: 0,
                    paddingTop: 8,
                    borderTopWidth: 0,
                    ...shadows.lg,
                },
                sceneStyle: {
                    paddingBottom: 96,
                    backgroundColor: colors.background.default,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600' as any,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen as any}
                options={{ tabBarLabel: 'Trang chủ' }}
            />
            <Tab.Screen
                name="SearchTab"
                component={SearchScreen as any}
                options={{ tabBarLabel: 'Tìm kiếm' }}
            />
            <Tab.Screen
                name="WishlistTab"
                component={WishlistScreen as any}
                options={{
                    tabBarLabel: 'Yêu thích',
                    tabBarBadge: wishlistBadge,
                    tabBarBadgeStyle: { backgroundColor: '#0B5ED7', color: 'white' }
                }}
            />
            <Tab.Screen
                name="CartTab"
                component={CartScreen as any}
                options={{
                    tabBarLabel: 'Giỏ hàng',
                    tabBarBadge: cartBadge,
                    tabBarBadgeStyle: { backgroundColor: '#0B5ED7', color: 'white' }
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen as any}
                options={{ tabBarLabel: 'Cá nhân' }}
            />
        </Tab.Navigator>
    );
}
