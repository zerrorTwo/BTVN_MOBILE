import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Snackbar, HelperText } from 'react-native-paper';
import { useForgetPasswordMutation } from '../store/api/authApi';
import { validateEmail } from '../utils/validation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgetPassword'>;

export default function ForgetPasswordScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [resetToken, setResetToken] = useState('');
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

            if (result.success && result.resetToken) {
                setResetToken(result.resetToken);
                setSnackbarMessage('Reset token generated! (In production, this would be sent via email)');
                setSnackbarVisible(true);
            }
        } catch (error: any) {
            const message = error?.data?.message || 'Failed to generate reset token. Please try again.';
            setSnackbarMessage(message);
            setSnackbarVisible(true);
        }
    };

    const handleNavigateToReset = () => {
        if (resetToken) {
            navigation.navigate('ResetPassword', { token: resetToken });
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
                        <Title style={styles.title}>Forgot Password</Title>
                        <Paragraph style={styles.subtitle}>
                            Enter your email to receive a password reset token
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
                            Send Reset Token
                        </Button>

                        {resetToken && (
                            <View style={styles.tokenContainer}>
                                <Paragraph style={styles.tokenLabel}>Reset Token:</Paragraph>
                                <TextInput
                                    value={resetToken}
                                    mode="outlined"
                                    editable={false}
                                    multiline
                                    style={styles.tokenInput}
                                />
                                <Paragraph style={styles.tokenNote}>
                                    Copy this token or click below to reset your password
                                </Paragraph>
                                <Button
                                    mode="contained"
                                    onPress={handleNavigateToReset}
                                    style={styles.button}
                                >
                                    Reset Password
                                </Button>
                            </View>
                        )}

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
    tokenContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
    },
    tokenLabel: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    tokenInput: {
        marginBottom: 8,
        backgroundColor: 'white',
    },
    tokenNote: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
});
