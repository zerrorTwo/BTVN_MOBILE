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
import HomeScreen from '../screens/HomeScreen';

export type RootStackParamList = {
    Intro: undefined;
    Login: undefined;
    Register: undefined;
    Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const dispatch = useDispatch();

    // Load user from AsyncStorage on app start
    useEffect(() => {
        const loadUser = async () => {
            try {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    const user: User = JSON.parse(userJson);
                    dispatch(setCredentials({ user }));
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
                    <>
                        <Stack.Screen
                            name="Intro"
                            component={IntroScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{ title: 'Home' }}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ title: 'Login' }}
                        />
                        <Stack.Screen
                            name="Register"
                            component={RegisterScreen}
                            options={{ title: 'Register' }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
