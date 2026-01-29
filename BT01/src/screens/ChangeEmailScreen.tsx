import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import tw from 'twrnc';
import { updateUser } from '../store/authSlice';
import {
    useRequestEmailOTPMutation,
    useChangeEmailMutation,
} from '../services/api/profileApi';
import Layout from '../components/Layout';
import type { RootState } from '../store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangeEmail'>;

type Step = 'input' | 'otp';

export default function ChangeEmailScreen({ navigation }: Props) {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    const [step, setStep] = useState<Step>('input');
    const [newEmail, setNewEmail] = useState('');
    const [otp, setOtp] = useState('');

    const [requestOTP, { isLoading: isRequestingOTP }] = useRequestEmailOTPMutation();
    const [changeEmail, { isLoading: isChanging }] = useChangeEmailMutation();

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleRequestOTP = async () => {
        if (!newEmail) {
            Alert.alert('Lỗi', 'Vui lòng nhập email mới.');
            return;
        }
        if (!validateEmail(newEmail)) {
            Alert.alert('Lỗi', 'Email không hợp lệ.');
            return;
        }
        if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
            Alert.alert('Lỗi', 'Email mới phải khác email hiện tại.');
            return;
        }

        try {
            const result = await requestOTP({ newEmail }).unwrap();

            if (result.success) {
                Alert.alert('Thành công', result.message);
                setStep('otp');
            } else {
                Alert.alert('Lỗi', result.message || 'Có lỗi xảy ra.');
            }
        } catch (error: any) {
            console.error('Request email OTP error:', error);
            const message = error?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            Alert.alert('Lỗi', message);
        }
    };

    const handleChangeEmail = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert('Lỗi', 'Vui lòng nhập mã OTP 6 chữ số.');
            return;
        }

        try {
            const result = await changeEmail({ newEmail, otp }).unwrap();

            if (result.success && result.user) {
                dispatch(updateUser({ email: result.user.email }));
                Alert.alert('Thành công', result.message, [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('Lỗi', result.message || 'Có lỗi xảy ra.');
            }
        } catch (error: any) {
            console.error('Change email error:', error);
            const message = error?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            Alert.alert('Lỗi', message);
        }
    };

    const handleResendOTP = async () => {
        try {
            const result = await requestOTP({ newEmail }).unwrap();
            if (result.success) {
                Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email mới.');
            }
        } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể gửi lại mã OTP.');
        }
    };

    return (
        <Layout>
            <ScrollView
                style={tw`flex-1 bg-gray-100`}
                contentContainerStyle={tw`p-4 pb-8`}
                keyboardShouldPersistTaps="handled"
            >
                {/* Current Email Info */}
                <Card style={tw`bg-blue-50 rounded-xl mb-4`} elevation={1}>
                    <Card.Content style={tw`p-4`}>
                        <Text style={tw`text-blue-800 text-sm`}>
                            ✉️ Email hiện tại: {user?.email}
                        </Text>
                        <Text style={tw`text-blue-600 text-xs mt-1`}>
                            Mã OTP sẽ được gửi đến email mới để xác nhận.
                        </Text>
                    </Card.Content>
                </Card>

                {step === 'input' ? (
                    // Step 1: Enter new email
                    <>
                        <Card style={tw`bg-white rounded-2xl mb-6`} elevation={2}>
                            <Card.Content style={tw`py-4`}>
                                <Text style={tw`text-gray-700 font-semibold mb-2`}>
                                    Email mới
                                </Text>
                                <TextInput
                                    mode="outlined"
                                    value={newEmail}
                                    onChangeText={setNewEmail}
                                    placeholder="Nhập email mới"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={tw`bg-white`}
                                    outlineColor="#e5e7eb"
                                    activeOutlineColor="#6366f1"
                                    left={<TextInput.Icon icon="email-outline" />}
                                />
                            </Card.Content>
                        </Card>

                        <Button
                            mode="contained"
                            onPress={handleRequestOTP}
                            loading={isRequestingOTP}
                            disabled={isRequestingOTP}
                            style={tw`rounded-xl`}
                            buttonColor="#6366f1"
                            contentStyle={tw`py-2`}
                        >
                            {isRequestingOTP ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </Button>
                    </>
                ) : (
                    // Step 2: Enter OTP
                    <>
                        <Card style={tw`bg-white rounded-2xl mb-4`} elevation={2}>
                            <Card.Content style={tw`py-4`}>
                                <Text style={tw`text-gray-700 font-semibold mb-2`}>
                                    Nhập mã OTP
                                </Text>
                                <Text style={tw`text-gray-500 text-sm mb-4`}>
                                    Mã OTP đã được gửi đến: {newEmail}
                                </Text>
                                <TextInput
                                    mode="outlined"
                                    value={otp}
                                    onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                                    placeholder="Nhập mã OTP 6 số"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    style={tw`bg-white text-center text-2xl tracking-widest`}
                                    outlineColor="#e5e7eb"
                                    activeOutlineColor="#6366f1"
                                />
                            </Card.Content>
                        </Card>

                        <Button
                            mode="contained"
                            onPress={handleChangeEmail}
                            loading={isChanging}
                            disabled={isChanging}
                            style={tw`rounded-xl mb-3`}
                            buttonColor="#6366f1"
                            contentStyle={tw`py-2`}
                        >
                            {isChanging ? 'Đang xác nhận...' : 'Xác nhận'}
                        </Button>

                        <View style={tw`flex-row justify-center items-center`}>
                            <Text style={tw`text-gray-500`}>Không nhận được mã? </Text>
                            <Button
                                mode="text"
                                onPress={handleResendOTP}
                                disabled={isRequestingOTP}
                                textColor="#6366f1"
                                compact
                            >
                                Gửi lại
                            </Button>
                        </View>

                        <Button
                            mode="text"
                            onPress={() => {
                                setStep('input');
                                setOtp('');
                            }}
                            textColor="#6b7280"
                            style={tw`mt-2`}
                        >
                            ← Quay lại
                        </Button>
                    </>
                )}
            </ScrollView>
        </Layout>
    );
}
