import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import type { RootState } from '../store';
import type { User } from '../types';

// Screens
import IntroScreen from '../screens/IntroScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ForgetPasswordScreen from '../screens/ForgetPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ChangePhoneScreen from '../screens/ChangePhoneScreen';
import ChangeEmailScreen from '../screens/ChangeEmailScreen';
import SearchScreen from '../screens/SearchScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';

export type RootStackParamList = {
    Intro: undefined;
    Login: undefined;
    Register: undefined;
    OTPVerification: { email: string; purpose: 'REGISTER' | 'RESET_PASSWORD' };
    ForgetPassword: undefined;
    ResetPassword: { resetToken: string };
    Home: undefined;
    AdminHome: undefined;
    Profile: undefined;
    EditProfile: undefined;
    ChangePassword: undefined;
    ChangePhone: undefined;
    ChangeEmail: undefined;
    Search: { categoryId?: number; sortBy?: string } | undefined;
    ProductDetail: { productId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    // Load user and token from AsyncStorage on app start
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userJson = await AsyncStorage.getItem('user');

                if (token && userJson) {
                    const user: User = JSON.parse(userJson);
                    dispatch(setCredentials({ user, token }));
                }
            } catch (error) {
                console.error('Failed to load user:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, [dispatch]);

    if (isLoading) {
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#6200EE',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                {isAuthenticated ? (
                    user?.role === 'ADMIN' ? (
                        // Admin Stack
                        <Stack.Screen
                            name="AdminHome"
                            component={AdminHomeScreen}
                            options={{ title: 'Admin Dashboard' }}
                        />
                    ) : (
                        // User Stack
                        <>
                            <Stack.Screen
                                name="Intro"
                                component={IntroScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="Home"
                                component={HomeScreen}
                                options={{ title: 'Trang chủ' }}
                            />
                            <Stack.Screen
                                name="Profile"
                                component={ProfileScreen}
                                options={{ title: 'Hồ sơ' }}
                            />
                            <Stack.Screen
                                name="EditProfile"
                                component={EditProfileScreen}
                                options={{ title: 'Chỉnh sửa hồ sơ' }}
                            />
                            <Stack.Screen
                                name="ChangePassword"
                                component={ChangePasswordScreen}
                                options={{ title: 'Đổi mật khẩu' }}
                            />
                            <Stack.Screen
                                name="ChangePhone"
                                component={ChangePhoneScreen}
                                options={{ title: 'Đổi số điện thoại' }}
                            />
                            <Stack.Screen
                                name="ChangeEmail"
                                component={ChangeEmailScreen}
                                options={{ title: 'Đổi email' }}
                            />
                            <Stack.Screen
                                name="Search"
                                component={SearchScreen}
                                options={{ title: 'Tìm kiếm' }}
                            />
                            <Stack.Screen
                                name="ProductDetail"
                                component={ProductDetailScreen}
                                options={{ title: 'Chi tiết sản phẩm' }}
                            />
                        </>
                    )
                ) : (
                    // Auth Stack
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ title: 'Đăng nhập' }}
                        />
                        <Stack.Screen
                            name="Register"
                            component={RegisterScreen}
                            options={{ title: 'Đăng ký' }}
                        />
                        <Stack.Screen
                            name="OTPVerification"
                            component={OTPVerificationScreen}
                            options={{ title: 'Xác thực OTP' }}
                        />
                        <Stack.Screen
                            name="ForgetPassword"
                            component={ForgetPasswordScreen}
                            options={{ title: 'Quên mật khẩu' }}
                        />
                        <Stack.Screen
                            name="ResetPassword"
                            component={ResetPasswordScreen}
                            options={{ title: 'Đặt lại mật khẩu' }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
