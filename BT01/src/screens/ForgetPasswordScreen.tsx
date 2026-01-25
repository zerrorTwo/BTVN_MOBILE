import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Snackbar, HelperText } from 'react-native-paper';
import { useForgetPasswordMutation } from '../store/api/authApi';
import { validateEmail } from '../utils/validation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgetPassword'>;

export default function ForgetPasswordScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [forgetPassword, { isLoading }] = useForgetPasswordMutation();

    const handleForgetPassword = async () => {
        // Validate email
        const emailErr = validateEmail(email);
        setEmailError(emailErr || '');

        if (emailErr) {
            return;
        }

        try {
            const result = await forgetPassword({ email }).unwrap();

            if (result.success) {
                Alert.alert(
                    'Thành công',
                    'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('OTPVerification', {
                                email: result.email || email,
                                purpose: 'RESET_PASSWORD'
                            })
                        }
                    ]
                );
            }
        } catch (error: any) {
            const message = error?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.';
            setSnackbarMessage(message);
            setSnackbarVisible(true);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title style={styles.title}>Quên mật khẩu</Title>
                        <Paragraph style={styles.subtitle}>
                            Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
                        </Paragraph>

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

                        <Button
                            mode="contained"
                            onPress={handleForgetPassword}
                            loading={isLoading}
                            disabled={isLoading}
                            style={styles.button}
                        >
                            Gửi mã OTP
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={() => navigation.navigate('Login')}
                            style={styles.button}
                        >
                            Quay lại đăng nhập
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
});
