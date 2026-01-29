import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Avatar, Card, List, Divider, Button, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import tw from 'twrnc';
import { logout } from '../store/authSlice';
import Layout from '../components/Layout';
import type { RootState } from '../store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(logout());
                        navigation.replace('Login');
                    },
                },
            ]
        );
    };

    if (!user) {
        return (
            <Layout>
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            </Layout>
        );
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const profileItems = [
        {
            title: 'Chỉnh sửa hồ sơ',
            description: 'Thay đổi tên và ảnh đại diện',
            icon: 'account-edit',
            onPress: () => navigation.navigate('EditProfile'),
        },
        {
            title: 'Đổi mật khẩu',
            description: 'Cập nhật mật khẩu đăng nhập',
            icon: 'lock-reset',
            onPress: () => navigation.navigate('ChangePassword'),
        },
        {
            title: 'Đổi số điện thoại',
            description: user.phone || 'Chưa cập nhật',
            icon: 'phone-outline',
            onPress: () => navigation.navigate('ChangePhone'),
        },
        {
            title: 'Đổi email',
            description: user.email,
            icon: 'email-outline',
            onPress: () => navigation.navigate('ChangeEmail'),
        },
    ];

    return (
        <Layout>
            <ScrollView style={tw`flex-1 bg-gray-100`} contentContainerStyle={tw`pb-8`}>
                {/* Profile Header */}
                <View style={tw`bg-indigo-600 pt-8 pb-16 px-6 items-center`}>
                    <TouchableOpacity
                        style={tw`mb-4`}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        {user.avatar ? (
                            <Avatar.Image
                                size={100}
                                source={{ uri: user.avatar }}
                                style={tw`bg-white`}
                            />
                        ) : (
                            <Avatar.Text
                                size={100}
                                label={getInitials(user.name)}
                                style={tw`bg-white`}
                                labelStyle={tw`text-indigo-600 font-bold text-3xl`}
                            />
                        )}
                        <View style={tw`absolute bottom-0 right-0 bg-white rounded-full p-1`}>
                            <List.Icon icon="camera" color="#6366f1" style={tw`m-0`} />
                        </View>
                    </TouchableOpacity>

                    <Text style={tw`text-white text-2xl font-bold mb-1`}>{user.name}</Text>
                    <Text style={tw`text-indigo-200 text-base`}>{user.email}</Text>

                    {user.isVerified && (
                        <View style={tw`flex-row items-center mt-2 bg-green-500/20 px-3 py-1 rounded-full`}>
                            <List.Icon icon="check-decagram" color="#22c55e" style={tw`m-0`} />
                            <Text style={tw`text-green-400 text-sm ml-1`}>Đã xác thực</Text>
                        </View>
                    )}
                </View>

                {/* Profile Content */}
                <View style={tw`-mt-8 px-4`}>
                    {/* Info Card */}
                    <Card style={tw`bg-white rounded-2xl mb-4`} elevation={4}>
                        <Card.Content style={tw`p-4`}>
                            <View style={tw`flex-row justify-between`}>
                                <View>
                                    <Text style={tw`text-gray-400 text-xs uppercase`}>Vai trò</Text>
                                    <Text style={tw`text-gray-700 font-semibold mt-1`}>{user.role}</Text>
                                </View>
                                <View style={tw`items-end`}>
                                    <Text style={tw`text-gray-400 text-xs uppercase`}>Ngày tham gia</Text>
                                    <Text style={tw`text-gray-700 font-semibold mt-1`}>
                                        {user.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                                            : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            {user.phone && (
                                <>
                                    <Divider style={tw`my-3`} />
                                    <View>
                                        <Text style={tw`text-gray-400 text-xs uppercase`}>Số điện thoại</Text>
                                        <Text style={tw`text-gray-700 font-semibold mt-1`}>{user.phone}</Text>
                                    </View>
                                </>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Settings List */}
                    <Card style={tw`bg-white rounded-2xl mb-4`} elevation={2}>
                        <Card.Content style={tw`p-0`}>
                            {profileItems.map((item, index) => (
                                <React.Fragment key={index}>
                                    <List.Item
                                        title={item.title}
                                        description={item.description}
                                        left={(props) => (
                                            <List.Icon
                                                {...props}
                                                icon={item.icon}
                                                color="#6366f1"
                                            />
                                        )}
                                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                                        onPress={item.onPress}
                                        style={tw`px-4`}
                                        titleStyle={tw`font-semibold text-gray-800`}
                                        descriptionStyle={tw`text-gray-500`}
                                    />
                                    {index < profileItems.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </Card.Content>
                    </Card>

                    {/* Logout Button */}
                    <Button
                        mode="outlined"
                        onPress={handleLogout}
                        style={tw`rounded-xl border-2 border-red-200 bg-white`}
                        textColor="#dc2626"
                        icon="logout"
                        contentStyle={tw`py-2`}
                    >
                        Đăng xuất
                    </Button>

                    <Text style={tw`text-center text-gray-400 text-xs mt-4`}>
                        Phiên bản 1.0.0
                    </Text>
                </View>
            </ScrollView>
        </Layout>
    );
}
