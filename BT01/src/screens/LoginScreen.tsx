import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Snackbar, HelperText, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLoginMutation } from '../services/api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { validateEmail, validatePassword } from '../utils/validation';
import { colors, gradients, shadows, cardShadow, typography } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [login, { isLoading }] = useLoginMutation();
    const dispatch = useDispatch();

    const handleLogin = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);

        setEmailError(emailErr || '');
        setPasswordError(passwordErr || '');

        if (emailErr || passwordErr) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        try {
            const result = await login({ email, password }).unwrap();

            if (result.success && result.user && result.token) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                dispatch(setCredentials({ user: result.user, token: result.token }));
                navigation.replace('Intro');
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            if (error?.data?.code === 'ACCOUNT_NOT_VERIFIED') {
                setSnackbarMessage('Tài khoản chưa được xác thực. Vui lòng kiểm tra email để lấy mã OTP.');
                setSnackbarVisible(true);
                setTimeout(() => {
                    navigation.navigate('OTPVerification', {
                        email: error.data.email || email,
                        purpose: 'REGISTER',
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient colors={gradients.primary as any} style={styles.gradient}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Logo Section */}
                        <View style={styles.logoContainer}>
                            <View style={[styles.logoCircle, cardShadow]}>
                                <Ionicons name="cart" size={48} color={colors.primary.main} />
                            </View>
                            <Text style={styles.logoText}>ShopApp</Text>
                        </View>

                        {/* Login Card */}
                        <View style={[styles.card, cardShadow]}>
                            <Text style={styles.title}>Chào mừng trở lại</Text>
                            <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
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
                                    left={<TextInput.Icon icon="email-outline" />}
                                />
                            </View>
                            {emailError ? (
                                <HelperText type="error" visible={!!emailError} style={styles.helperText}>
                                    {emailError}
                                </HelperText>
                            ) : null}

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Mật khẩu"
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        setPasswordError('');
                                    }}
                                    mode="outlined"
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                    error={!!passwordError}
                                    left={<TextInput.Icon icon="lock-outline" />}
                                    right={
                                        <TextInput.Icon
                                            icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setShowPassword(!showPassword);
                                            }}
                                        />
                                    }
                                />
                            </View>
                            {passwordError ? (
                                <HelperText type="error" visible={!!passwordError} style={styles.helperText}>
                                    {passwordError}
                                </HelperText>
                            ) : null}

                            {/* Forgot Password Link */}
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    navigation.navigate('ForgetPassword');
                                }}
                                style={styles.forgotButton}
                            >
                                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                            </TouchableOpacity>

                            {/* Login Button */}
                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.8}
                                style={styles.loginButtonContainer}
                            >
                                <LinearGradient colors={gradients.primary as any} style={styles.loginButton}>
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.loginButtonText}>Đăng nhập</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>hoặc</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Register Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    navigation.navigate('Register');
                                }}
                                style={styles.registerButton}
                            >
                                <Text style={styles.registerButtonText}>
                                    Chưa có tài khoản? <Text style={styles.registerButtonTextBold}>Đăng ký</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                    style={styles.snackbar}
                >
                    {snackbarMessage}
                </Snackbar>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.background.paper,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        ...typography.h2,
        color: colors.text.white,
        fontWeight: '700' as any,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    card: {
        backgroundColor: colors.background.paper,
        borderRadius: 24,
        padding: 24,
    },
    title: {
        ...typography.h3,
        textAlign: 'center',
        color: colors.text.primary,
        marginBottom: 8,
    },
    subtitle: {
        ...typography.body1,
        textAlign: 'center',
        color: colors.text.secondary,
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 4,
    },
    input: {
        backgroundColor: colors.background.paper,
    },
    inputIconContainer: {
        position: 'absolute',
        left: 12,
        top: 16,
        zIndex: 1,
    },
    helperText: {
        marginBottom: 8,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginTop: 8,
        marginBottom: 24,
    },
    forgotText: {
        ...typography.body2,
        color: colors.primary.main,
        fontWeight: '600',
    },
    loginButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        ...shadows.md,
    },
    loginButton: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    loginButtonText: {
        ...typography.button,
        color: colors.text.white,
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'none',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border.light,
    },
    dividerText: {
        ...typography.body2,
        color: colors.text.secondary,
        marginHorizontal: 16,
    },
    registerButton: {
        paddingVertical: 12,
    },
    registerButtonText: {
        ...typography.body1,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    registerButtonTextBold: {
        color: colors.primary.main,
        fontWeight: '600' as any,
    },
    snackbar: {
        backgroundColor: colors.error.main,
    },
});
