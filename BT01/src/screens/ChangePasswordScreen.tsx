import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import tw from 'twrnc';
import { useChangePasswordMutation } from '../services/api/profileApi';
import Layout from '../components/Layout';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [changePassword, { isLoading }] = useChangePasswordMutation();

    const validateForm = (): boolean => {
        if (!currentPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại.');
            return false;
        }
        if (!newPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới.');
            return false;
        }
        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return false;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
            return false;
        }
        if (currentPassword === newPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải khác mật khẩu hiện tại.');
            return false;
        }
        return true;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) return;

        try {
            const result = await changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            }).unwrap();

            if (result.success) {
                Alert.alert('Thành công', result.message, [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('Lỗi', result.message || 'Có lỗi xảy ra.');
            }
        } catch (error: any) {
            console.error('Change password error:', error);
            const message = error?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            Alert.alert('Lỗi', message);
        }
    };

    return (
        <Layout>
            <ScrollView
                style={tw`flex-1 bg-gray-100`}
                contentContainerStyle={tw`p-4 pb-8`}
                keyboardShouldPersistTaps="handled"
            >
                {/* Info Card */}
                <Card style={tw`bg-orange-50 rounded-xl mb-4`} elevation={1}>
                    <Card.Content style={tw`p-4`}>
                        <Text style={tw`text-orange-800 text-sm`}>
                            🔒 Mật khẩu mới phải có ít nhất 6 ký tự. Sau khi đổi mật khẩu thành công,
                            bạn sẽ cần sử dụng mật khẩu mới để đăng nhập.
                        </Text>
                    </Card.Content>
                </Card>

                {/* Password Form */}
                <Card style={tw`bg-white rounded-2xl mb-6`} elevation={2}>
                    <Card.Content style={tw`py-4`}>
                        {/* Current Password */}
                        <Text style={tw`text-gray-700 font-semibold mb-2`}>Mật khẩu hiện tại</Text>
                        <TextInput
                            mode="outlined"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Nhập mật khẩu hiện tại"
                            secureTextEntry={!showCurrentPassword}
                            right={
                                <TextInput.Icon
                                    icon={showCurrentPassword ? 'eye-off' : 'eye'}
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                />
                            }
                            style={tw`bg-white mb-4`}
                            outlineColor="#e5e7eb"
                            activeOutlineColor="#EE4D2D"
                        />

                        {/* New Password */}
                        <Text style={tw`text-gray-700 font-semibold mb-2`}>Mật khẩu mới</Text>
                        <TextInput
                            mode="outlined"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                            secureTextEntry={!showNewPassword}
                            right={
                                <TextInput.Icon
                                    icon={showNewPassword ? 'eye-off' : 'eye'}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                />
                            }
                            style={tw`bg-white mb-4`}
                            outlineColor="#e5e7eb"
                            activeOutlineColor="#EE4D2D"
                        />

                        {/* Confirm Password */}
                        <Text style={tw`text-gray-700 font-semibold mb-2`}>Xác nhận mật khẩu mới</Text>
                        <TextInput
                            mode="outlined"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Nhập lại mật khẩu mới"
                            secureTextEntry={!showConfirmPassword}
                            right={
                                <TextInput.Icon
                                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                            }
                            style={tw`bg-white`}
                            outlineColor="#e5e7eb"
                            activeOutlineColor="#EE4D2D"
                        />
                    </Card.Content>
                </Card>

                {/* Submit Button */}
                <Button
                    mode="contained"
                    onPress={handleChangePassword}
                    loading={isLoading}
                    disabled={isLoading}
                    style={tw`rounded-xl`}
                    buttonColor="#EE4D2D"
                    contentStyle={tw`py-2`}
                >
                    {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </Button>
            </ScrollView>
        </Layout>
    );
}
