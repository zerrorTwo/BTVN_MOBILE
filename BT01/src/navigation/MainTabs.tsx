import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors, shadows } from '../theme';
import type { RootState } from '../store';
import HomeScreen from '../screens/HomeScreen';
import { CartScreen } from '../screens/CartScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import { useGetCartQuery } from '../services/api/cartApi';
import { useGetOrdersQuery } from '../services/api/orderApi';
import { OrderStatus } from '../types/order.types';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    // Fetch data for badges
    const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });
    const { data: ordersData } = useGetOrdersQuery({ page: 1, limit: 50 }, { skip: !isAuthenticated });

    const cartBadge = useMemo(() => {
        const count = cartData?.data?.itemCount || 0;
        return count > 0 ? count : undefined;
    }, [cartData]);

    const ordersBadge = useMemo(() => {
        const activeOrders = ordersData?.data?.filter(order =>
            [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPING].includes(order.status)
        ) || [];
        const count = activeOrders.length;
        return count > 0 ? count : undefined;
    }, [ordersData]);

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
                    } else if (route.name === 'CartTab') {
                        iconName = focused ? 'cart' : 'cart-outline';
                    } else if (route.name === 'OrdersTab') {
                        iconName = focused ? 'receipt' : 'receipt-outline';
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
                name="CartTab"
                component={CartScreen as any}
                options={{
                    tabBarLabel: 'Giỏ hàng',
                    tabBarStyle: { display: 'none' },
                    tabBarBadge: cartBadge,
                    tabBarBadgeStyle: { backgroundColor: '#EE4D2D', color: 'white' }
                }}
            />
            <Tab.Screen
                name="OrdersTab"
                component={OrdersScreen as any}
                options={{
                    tabBarLabel: 'Đơn hàng',
                    tabBarBadge: ordersBadge,
                    tabBarBadgeStyle: { backgroundColor: '#EE4D2D', color: 'white' }
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
