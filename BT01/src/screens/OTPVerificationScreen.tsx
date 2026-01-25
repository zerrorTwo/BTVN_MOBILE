import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from "react-native";
import { Text, TextInput, Button, HelperText } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useVerifyOTPMutation, useResendOTPMutation } from "../store/api/authApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = NativeStackScreenProps<RootStackParamList, "OTPVerification">;

export default function OTPVerificationScreen({ route, navigation }: Props) {
    const { email, purpose } = route.params;
    const [otp, setOTP] = useState("");
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation();
    const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert("Lỗi", "Vui lòng nhập mã OTP 6 chữ số");
            return;
        }

        try {
            const result = await verifyOTP({ email, otp, purpose }).unwrap();

            if (result.success) {
                if (purpose === "REGISTER") {
                    // Save token for registration
                    if (result.token) {
                        await AsyncStorage.setItem("token", result.token);
                    }
                    Alert.alert(
                        "Thành công",
                        "Tài khoản đã được xác thực thành công!",
                        [
                            {
                                text: "OK",
                                onPress: () => navigation.replace("Login"),
                            },
                        ]
                    );
                } else if (purpose === "RESET_PASSWORD") {
                    // Navigate to reset password screen with reset token
                    Alert.alert(
                        "Thành công",
                        "Mã OTP đã được xác thực. Vui lòng đặt mật khẩu mới.",
                        [
                            {
                                text: "OK",
                                onPress: () =>
                                    navigation.replace("ResetPassword", {
                                        resetToken: result.resetToken || "",
                                    }),
                            },
                        ]
                    );
                }
            }
        } catch (error: any) {
            const errorMessage =
                error?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn";
            Alert.alert("Lỗi", errorMessage);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;

        try {
            const result = await resendOTP({ email, purpose }).unwrap();

            if (result.success) {
                Alert.alert("Thành công", "Mã OTP mới đã được gửi đến email của bạn");
                setCountdown(60);
                setCanResend(false);
                setOTP("");
            }
        } catch (error: any) {
            const errorMessage = error?.data?.message || "Không thể gửi lại mã OTP";
            Alert.alert("Lỗi", errorMessage);
        }
    };

    const purposeText = purpose === "REGISTER" ? "Xác thực tài khoản" : "Đặt lại mật khẩu";

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>{purposeText}</Text>
                    <Text style={styles.subtitle}>
                        Mã OTP đã được gửi đến email:
                    </Text>
                    <Text style={styles.email}>{email}</Text>
                    <Text style={styles.description}>
                        Vui lòng nhập mã OTP 6 chữ số để tiếp tục
                    </Text>

                    <TextInput
                        label="Mã OTP"
                        value={otp}
                        onChangeText={setOTP}
                        mode="outlined"
                        keyboardType="number-pad"
                        maxLength={6}
                        style={styles.input}
                        autoFocus
                    />
                    <HelperText type="info" visible={true}>
                        Mã OTP có hiệu lực trong 5 phút
                    </HelperText>

                    <Button
                        mode="contained"
                        onPress={handleVerifyOTP}
                        loading={isVerifying}
                        disabled={isVerifying || otp.length !== 6}
                        style={styles.button}
                    >
                        Xác thực
                    </Button>

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Không nhận được mã? </Text>
                        {canResend ? (
                            <Button
                                mode="text"
                                onPress={handleResendOTP}
                                loading={isResending}
                                disabled={isResending}
                            >
                                Gửi lại mã OTP
                            </Button>
                        ) : (
                            <Text style={styles.countdown}>
                                Gửi lại sau {countdown}s
                            </Text>
                        )}
                    </View>

                    <Button
                        mode="text"
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        Quay lại
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 5,
    },
    email: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2196F3",
        textAlign: "center",
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
    },
    input: {
        marginBottom: 5,
        fontSize: 24,
        textAlign: "center",
        letterSpacing: 10,
    },
    button: {
        marginTop: 20,
        paddingVertical: 8,
    },
    resendContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    resendText: {
        fontSize: 14,
        color: "#666",
    },
    countdown: {
        fontSize: 14,
        color: "#2196F3",
        fontWeight: "bold",
    },
    backButton: {
        marginTop: 10,
    },
});
