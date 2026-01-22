import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Snackbar, HelperText } from 'react-native-paper';
import { useRegisterMutation } from '../store/api/authApi';
import { validateEmail, validatePassword, validateName, validatePasswordMatch } from '../utils/validation';
import Layout from '../components/Layout';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [register, { isLoading }] = useRegisterMutation();

    const handleRegister = async () => {
        // Validate inputs
        const nameErr = validateName(name);
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);
        const confirmPasswordErr = validatePasswordMatch(password, confirmPassword);

        setNameError(nameErr || '');
        setEmailError(emailErr || '');
        setPasswordError(passwordErr || '');
        setConfirmPasswordError(confirmPasswordErr || '');

        if (nameErr || emailErr || passwordErr || confirmPasswordErr) {
            return;
        }

        try {
            const result = await register({ name, email, password }).unwrap();

            if (result.success) {
                setSnackbarMessage('Registration successful! Please login.');
                setSnackbarVisible(true);
                // Navigate to Login after 2 seconds
                setTimeout(() => {
                    navigation.replace('Login');
                }, 2000);
            }
        } catch (error: any) {
            const message = error?.data?.message || 'Registration failed. Please try again.';
            setSnackbarMessage(message);
            setSnackbarVisible(true);
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
                            <Title style={styles.title}>Create Account</Title>
                            <Paragraph style={styles.subtitle}>Sign up to get started</Paragraph>

                            <TextInput
                                label="Name"
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    setNameError('');
                                }}
                                mode="outlined"
                                style={styles.input}
                                error={!!nameError}
                            />
                            <HelperText type="error" visible={!!nameError}>
                                {nameError}
                            </HelperText>

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

                            <TextInput
                                label="Confirm Password"
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
                                onPress={handleRegister}
                                loading={isLoading}
                                disabled={isLoading}
                                style={styles.button}
                            >
                                Register
                            </Button>

                            <Button
                                mode="outlined"
                                onPress={() => navigation.navigate('Login')}
                                style={styles.button}
                            >
                                Already have an account? Login
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
});
