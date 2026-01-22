import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Snackbar, HelperText } from 'react-native-paper';
import { useResetPasswordMutation } from '../store/api/authApi';
import { validatePassword, validatePasswordMatch } from '../utils/validation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
    const [token, setToken] = useState(route.params?.token || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [tokenError, setTokenError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [resetPassword, { isLoading }] = useResetPasswordMutation();

    const handleResetPassword = async () => {
        // Validate inputs
        let hasError = false;

        if (!token) {
            setTokenError('Reset token is required');
            hasError = true;
        } else {
            setTokenError('');
        }

        const passwordErr = validatePassword(newPassword);
        const confirmPasswordErr = validatePasswordMatch(newPassword, confirmPassword);

        setPasswordError(passwordErr || '');
        setConfirmPasswordError(confirmPasswordErr || '');

        if (hasError || passwordErr || confirmPasswordErr) {
            return;
        }

        try {
            const result = await resetPassword({ token, newPassword }).unwrap();

            if (result.success) {
                setSnackbarMessage('Password reset successful! Please login with your new password.');
                setSnackbarVisible(true);
                // Navigate to Login after 2 seconds
                setTimeout(() => {
                    navigation.replace('Login');
                }, 2000);
            }
        } catch (error: any) {
            const message = error?.data?.message || 'Password reset failed. Please try again.';
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
                        <Title style={styles.title}>Reset Password</Title>
                        <Paragraph style={styles.subtitle}>
                            Enter your reset token and new password
                        </Paragraph>

                        <TextInput
                            label="Reset Token"
                            value={token}
                            onChangeText={(text) => {
                                setToken(text);
                                setTokenError('');
                            }}
                            mode="outlined"
                            multiline
                            style={styles.input}
                            error={!!tokenError}
                        />
                        <HelperText type="error" visible={!!tokenError}>
                            {tokenError}
                        </HelperText>

                        <TextInput
                            label="New Password"
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
                            label="Confirm New Password"
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
                            Reset Password
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={() => navigation.navigate('Login')}
                            style={styles.button}
                        >
                            Back to Login
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
