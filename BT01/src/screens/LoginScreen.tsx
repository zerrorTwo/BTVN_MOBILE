import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Snackbar, HelperText } from 'react-native-paper';
import { useLoginMutation } from '../store/api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { validateEmail, validatePassword } from '../utils/validation';
import Layout from '../components/Layout';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [login, { isLoading }] = useLoginMutation();
    const dispatch = useDispatch();

    const handleLogin = async () => {
        // Validate inputs
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);

        setEmailError(emailErr || '');
        setPasswordError(passwordErr || '');

        if (emailErr || passwordErr) {
            return;
        }

        try {
            const result = await login({ email, password }).unwrap();

            if (result.success && result.user && result.token) {
                // Store credentials in Redux and AsyncStorage
                dispatch(setCredentials({ user: result.user, token: result.token }));
                // Navigate to Intro
                navigation.replace('Intro');
            }
        } catch (error: any) {
            // Check if account is not verified
            if (error?.data?.code === 'ACCOUNT_NOT_VERIFIED') {
                setSnackbarMessage('Tài khoản chưa được xác thực. Vui lòng kiểm tra email để lấy mã OTP.');
                setSnackbarVisible(true);
                // Navigate to OTP verification
                setTimeout(() => {
                    navigation.navigate('OTPVerification', {
                        email: error.data.email || email,
                        purpose: 'REGISTER'
                    });
                }, 2000);
            } else {
                const message = error?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
                setSnackbarMessage(message);
                setSnackbarVisible(true);
            }
        }
    };

    return (
        <Layout>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Card style={styles.card}>
                        <Card.Content>
                            <Title style={styles.title}>Welcome Back</Title>
                            <Paragraph style={styles.subtitle}>Login to your account</Paragraph>

                            <TextInput
                                label="Email"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    setEmailError('');
                                }}
                                mode="outlined"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={styles.input}
                                error={!!emailError}
                            />
                            <HelperText type="error" visible={!!emailError}>
                                {emailError}
                            </HelperText>

                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setPasswordError('');
                                }}
                                mode="outlined"
                                secureTextEntry
                                style={styles.input}
                                error={!!passwordError}
                            />
                            <HelperText type="error" visible={!!passwordError}>
                                {passwordError}
                            </HelperText>

                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                loading={isLoading}
                                disabled={isLoading}
                                style={styles.button}
                            >
                                Đăng nhập
                            </Button>

                            <Button
                                mode="text"
                                onPress={() => navigation.navigate('ForgetPassword')}
                                style={styles.linkButton}
                            >
                                Quên mật khẩu?
                            </Button>

                            <Button
                                mode="outlined"
                                onPress={() => navigation.navigate('Register')}
                                style={styles.button}
                            >
                                Chưa có tài khoản? Đăng ký
                            </Button>
                        </Card.Content>
                    </Card>
                </ScrollView>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                >
                    {snackbarMessage}
                </Snackbar>
            </KeyboardAvoidingView>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        elevation: 4,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 24,
        color: '#666',
    },
    input: {
        marginBottom: 4,
    },
    button: {
        marginTop: 16,
    },
    linkButton: {
        marginTop: 8,
    },
});
