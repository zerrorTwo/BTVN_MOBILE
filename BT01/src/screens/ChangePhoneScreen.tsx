import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import tw from 'twrnc';
import { updateUser } from '../store/authSlice';
import {
    useRequestPhoneOTPMutation,
    useChangePhoneMutation,
} from '../services/api/profileApi';
import Layout from '../components/Layout';
import type { RootState } from '../store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePhone'>;

type Step = 'input' | 'otp';

export default function ChangePhoneScreen({ navigation }: Props) {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    const [step, setStep] = useState<Step>('input');
    const [newPhone, setNewPhone] = useState('');
    const [otp, setOtp] = useState('');

    const [requestOTP, { isLoading: isRequestingOTP }] = useRequestPhoneOTPMutation();
    const [changePhone, { isLoading: isChanging }] = useChangePhoneMutation();

    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phone);
    };

    const handleRequestOTP = async () => {
        if (!newPhone) {
            Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại mới.');
            return;
        }
        if (!validatePhone(newPhone)) {
            Alert.alert('Lỗi', 'Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.');
            return;
        }
        if (newPhone === user?.phone) {
            Alert.alert('Lỗi', 'Số điện thoại mới phải khác số hiện tại.');
            return;
        }

        try {
            const result = await requestOTP({ newPhone }).unwrap();

            if (result.success) {
                Alert.alert('Thành công', result.message);
                setStep('otp');
            } else {
                Alert.alert('Lỗi', result.message || 'Có lỗi xảy ra.');
            }
        } catch (error: any) {
            console.error('Request phone OTP error:', error);
            const message = error?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            Alert.alert('Lỗi', message);
        }
    };

    const handleChangePhone = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert('Lỗi', 'Vui lòng nhập mã OTP 6 chữ số.');
            return;
        }

        try {
            const result = await changePhone({ newPhone, otp }).unwrap();

            if (result.success && result.user) {
                dispatch(updateUser({ phone: result.user.phone }));
                Alert.alert('Thành công', result.message, [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('Lỗi', result.message || 'Có lỗi xảy ra.');
            }
        } catch (error: any) {
            console.error('Change phone error:', error);
            const message = error?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            Alert.alert('Lỗi', message);
        }
    };

    const handleResendOTP = async () => {
        try {
            const result = await requestOTP({ newPhone }).unwrap();
            if (result.success) {
                Alert.alert('Thành công', 'Mã OTP mới đã được gửi.');
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
                {/* Current Phone Info */}
                <Card style={tw`bg-orange-50 rounded-xl mb-4`} elevation={1}>
                    <Card.Content style={tw`p-4`}>
                        <Text style={tw`text-orange-800 text-sm`}>
                            📱 Số điện thoại hiện tại: {user?.phone || 'Chưa cập nhật'}
                        </Text>
                        <Text style={tw`text-orange-600 text-xs mt-1`}>
                            Mã OTP sẽ được gửi đến email của bạn để xác nhận.
                        </Text>
                    </Card.Content>
                </Card>

                {step === 'input' ? (
                    // Step 1: Enter new phone number
                    <>
                        <Card style={tw`bg-white rounded-2xl mb-6`} elevation={2}>
                            <Card.Content style={tw`py-4`}>
                                <Text style={tw`text-gray-700 font-semibold mb-2`}>
                                    Số điện thoại mới
                                </Text>
                                <TextInput
                                    mode="outlined"
                                    value={newPhone}
                                    onChangeText={setNewPhone}
                                    placeholder="Nhập số điện thoại mới (10-11 số)"
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    style={tw`bg-white`}
                                    outlineColor="#e5e7eb"
                                    activeOutlineColor="#0B5ED7"
                                    left={<TextInput.Affix text="+84 " />}
                                />
                            </Card.Content>
                        </Card>

                        <Button
                            mode="contained"
                            onPress={handleRequestOTP}
                            loading={isRequestingOTP}
                            disabled={isRequestingOTP}
                            style={tw`rounded-xl`}
                            buttonColor="#0B5ED7"
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
                                    Mã OTP đã được gửi đến email của bạn
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
                                    activeOutlineColor="#0B5ED7"
                                />
                            </Card.Content>
                        </Card>

                        <Button
                            mode="contained"
                            onPress={handleChangePhone}
                            loading={isChanging}
                            disabled={isChanging}
                            style={tw`rounded-xl mb-3`}
                            buttonColor="#0B5ED7"
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
                                textColor="#0B5ED7"
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
