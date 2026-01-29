import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, TextInput, Button, Avatar, Card, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import tw from 'twrnc';
import { updateUser } from '../store/authSlice';
import { useUpdateProfileMutation } from '../services/api/profileApi';
import Layout from '../components/Layout';
import type { RootState } from '../store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    const [name, setName] = useState(user?.name || '');
    const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
    const [isPickingImage, setIsPickingImage] = useState(false);

    const [updateProfile, { isLoading }] = useUpdateProfileMutation();

    const pickImage = async () => {
        try {
            setIsPickingImage(true);

            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh để tiếp tục.');
                return;
            }

            // Pick image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                const base64 = result.assets[0].base64;
                if (base64) {
                    const imageUri = `data:image/jpeg;base64,${base64}`;
                    setAvatar(imageUri);
                }
            }
        } catch (error) {
            console.error('Pick image error:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        } finally {
            setIsPickingImage(false);
        }
    };

    const takePhoto = async () => {
        try {
            setIsPickingImage(true);

            // Request permission
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera để tiếp tục.');
                return;
            }

            // Take photo
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                const base64 = result.assets[0].base64;
                if (base64) {
                    const imageUri = `data:image/jpeg;base64,${base64}`;
                    setAvatar(imageUri);
                }
            }
        } catch (error) {
            console.error('Take photo error:', error);
            Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
        } finally {
            setIsPickingImage(false);
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            'Chọn ảnh đại diện',
            'Bạn muốn lấy ảnh từ đâu?',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Chụp ảnh', onPress: takePhoto },
                { text: 'Thư viện', onPress: pickImage },
            ]
        );
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập họ tên.');
            return;
        }

        try {
            const result = await updateProfile({
                name: name.trim(),
                avatar: avatar || undefined,
            }).unwrap();

            if (result.success && result.user) {
                dispatch(updateUser({
                    name: result.user.name,
                    avatar: result.user.avatar,
                }));
                Alert.alert('Thành công', result.message, [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('Lỗi', result.message || 'Có lỗi xảy ra.');
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            const message = error?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            Alert.alert('Lỗi', message);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <Layout>
            <ScrollView
                style={tw`flex-1 bg-gray-100`}
                contentContainerStyle={tw`p-4 pb-8`}
                keyboardShouldPersistTaps="handled"
            >
                {/* Avatar Section */}
                <Card style={tw`bg-white rounded-2xl mb-4`} elevation={2}>
                    <Card.Content style={tw`items-center py-6`}>
                        <TouchableOpacity
                            onPress={showImageOptions}
                            disabled={isPickingImage}
                            style={tw`relative`}
                        >
                            {isPickingImage ? (
                                <View style={tw`w-32 h-32 rounded-full bg-gray-200 items-center justify-center`}>
                                    <ActivityIndicator size="large" color="#6366f1" />
                                </View>
                            ) : avatar ? (
                                <Avatar.Image
                                    size={128}
                                    source={{ uri: avatar }}
                                    style={tw`bg-gray-200`}
                                />
                            ) : (
                                <Avatar.Text
                                    size={128}
                                    label={getInitials(name || 'U')}
                                    style={tw`bg-indigo-100`}
                                    labelStyle={tw`text-indigo-600 font-bold text-4xl`}
                                />
                            )}
                            <View style={tw`absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2`}>
                                <Text style={tw`text-white text-xs`}>📷</Text>
                            </View>
                        </TouchableOpacity>
                        <Text style={tw`text-gray-500 text-sm mt-3`}>
                            Nhấn để thay đổi ảnh đại diện
                        </Text>
                    </Card.Content>
                </Card>

                {/* Name Input */}
                <Card style={tw`bg-white rounded-2xl mb-4`} elevation={2}>
                    <Card.Content style={tw`py-4`}>
                        <Text style={tw`text-gray-700 font-semibold mb-2`}>Họ và tên</Text>
                        <TextInput
                            mode="outlined"
                            value={name}
                            onChangeText={setName}
                            placeholder="Nhập họ và tên"
                            style={tw`bg-white`}
                            outlineColor="#e5e7eb"
                            activeOutlineColor="#6366f1"
                        />
                    </Card.Content>
                </Card>

                {/* Email (Read-only) */}
                <Card style={tw`bg-white rounded-2xl mb-6`} elevation={2}>
                    <Card.Content style={tw`py-4`}>
                        <Text style={tw`text-gray-700 font-semibold mb-2`}>Email</Text>
                        <TextInput
                            mode="outlined"
                            value={user?.email || ''}
                            editable={false}
                            style={tw`bg-gray-50`}
                            outlineColor="#e5e7eb"
                            textColor="#6b7280"
                        />
                        <Text style={tw`text-gray-400 text-xs mt-2`}>
                            Để đổi email, vui lòng sử dụng chức năng "Đổi email" trong trang Profile.
                        </Text>
                    </Card.Content>
                </Card>

                {/* Save Button */}
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={isLoading}
                    disabled={isLoading}
                    style={tw`rounded-xl`}
                    buttonColor="#6366f1"
                    contentStyle={tw`py-2`}
                >
                    {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </ScrollView>
        </Layout>
    );
}
