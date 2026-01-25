import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Snackbar, HelperText } from 'react-native-paper';
import { useResetPasswordMutation } from '../store/api/authApi';
import { validatePassword, validatePasswordMatch } from '../utils/validation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
    const { resetToken } = route.params;
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [resetPassword, { isLoading }] = useResetPasswordMutation();

    const handleResetPassword = async () => {
        // Validate inputs
        const passwordErr = validatePassword(newPassword);
        const confirmPasswordErr = validatePasswordMatch(newPassword, confirmPassword);

        setPasswordError(passwordErr || '');
        setConfirmPasswordError(confirmPasswordErr || '');

        if (passwordErr || confirmPasswordErr) {
            return;
        }

        try {
            const result = await resetPassword({ resetToken, newPassword }).unwrap();

            if (result.success) {
                Alert.alert(
                    'Thành công',
                    'Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập với mật khẩu mới.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.replace('Login')
                        }
                    ]
                );
            }
        } catch (error: any) {
            const message = error?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
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
                        <Title style={styles.title}>Đặt lại mật khẩu</Title>
                        <Paragraph style={styles.subtitle}>
                            Nhập mật khẩu mới của bạn
                        </Paragraph>

                        <TextInput
                            label="Mật khẩu mới"
                            value={newPassword}
                            onChangeText={(text) => {
                                setNewPassword(text);
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

                        <TextInput
                            label="Xác nhận mật khẩu mới"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setConfirmPasswordError('');
                            }}
                            mode="outlined"
                            secureTextEntry
                            style={styles.input}
                            error={!!confirmPasswordError}
                        />
                        <HelperText type="error" visible={!!confirmPasswordError}>
                            {confirmPasswordError}
                        </HelperText>

                        <Button
                            mode="contained"
                            onPress={handleResetPassword}
                            loading={isLoading}
                            disabled={isLoading}
                            style={styles.button}
                        >
                            Đặt lại mật khẩu
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
