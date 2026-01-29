import React from 'react';
import { View, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Avatar, IconButton, Divider, Surface } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import tw from 'twrnc';
import { logout } from '../store/authSlice';
import Layout from '../components/Layout';
import type { RootState } from '../store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigation.replace('Login');
  };

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  if (!user) {
    return (
      <Layout>
        <View style={tw`flex-1 justify-center items-center bg-gray-100 p-4`}>
          <Card style={tw`w-full bg-white rounded-2xl`} elevation={4}>
            <Card.Content style={tw`items-center p-6`}>
              <Avatar.Icon
                size={64}
                icon="alert-circle-outline"
                style={tw`bg-red-100 mb-4`}
                color="#dc2626"
              />
              <Text style={tw`text-xl font-bold text-gray-800 mb-2`}>
                Authentication Error
              </Text>
              <Text style={tw`text-gray-500 text-center mb-6`}>
                We couldn't load your profile. Please try logging in again.
              </Text>
              <Button
                mode="contained"
                onPress={handleLogout}
                style={tw`w-full rounded-full`}
                buttonColor="#3b82f6"
              >
                Back to Login
              </Button>
            </Card.Content>
          </Card>
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

  const quickActions = [
    { icon: 'account-cog', label: 'Profile', bgColor: '#dbeafe', iconColor: '#2563eb', onPress: () => navigation.navigate('Profile') },
    { icon: 'shield-check', label: 'Security', bgColor: '#d1fae5', iconColor: '#059669', onPress: () => navigation.navigate('ChangePassword') },
    { icon: 'bell-ring', label: 'Notices', bgColor: '#fef3c7', iconColor: '#d97706', onPress: () => { } },
    { icon: 'help-circle', label: 'Support', bgColor: '#ede9fe', iconColor: '#7c3aed', onPress: () => { } },
  ];

  return (
    <Layout>
      <ScrollView
        style={tw`flex-1 bg-gray-100`}
        contentContainerStyle={tw`pb-8`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Section with Gradient-like Background */}
        <View style={tw`bg-indigo-600 pt-8 pb-20 px-6`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View>
              <Text style={tw`text-indigo-200 text-sm font-medium uppercase tracking-wide`}>
                Welcome back
              </Text>
              <Text style={tw`text-white text-2xl font-bold mt-1`}>
                {user.name}
              </Text>
            </View>
            <Avatar.Text
              size={56}
              label={getInitials(user.name)}
              style={tw`bg-white`}
              labelStyle={tw`text-indigo-600 font-bold`}
              color="#4f46e5"
            />
          </View>

          {/* Search Bar - Navigate to Search Screen */}
          <TouchableOpacity
            style={tw`mt-6 bg-white/20 rounded-xl px-4 py-3 flex-row items-center`}
            onPress={() => navigation.navigate('Search')}
          >
            <IconButton icon="magnify" size={20} iconColor="#fff" style={tw`m-0 p-0`} />
            <Text style={tw`text-white/80 ml-2`}>Tìm kiếm sản phẩm...</Text>
          </TouchableOpacity>
        </View>

        {/* Content Section - overlapping header */}
        <View style={tw`-mt-12 px-4`}>
          {/* User Info Card */}
          <Card style={tw`bg-white rounded-2xl mb-4`} elevation={4}>
            <Card.Content style={tw`p-4`}>
              {/* Email & Status Row */}
              <View style={tw`flex-row justify-between items-start mb-4`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-400 text-xs uppercase mb-1`}>Email Address</Text>
                  <Text style={tw`text-gray-800 font-semibold text-sm`}>{user.email}</Text>
                </View>
                <View style={[
                  tw`px-3 py-1 rounded-full`,
                  { backgroundColor: user.isVerified ? '#dcfce7' : '#fef2f2' }
                ]}>
                  <Text style={[
                    tw`text-xs font-bold`,
                    { color: user.isVerified ? '#16a34a' : '#dc2626' }
                  ]}>
                    {user.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                  </Text>
                </View>
              </View>

              <Divider style={tw`my-3`} />

              {/* Member Info Row */}
              <View style={tw`flex-row justify-between`}>
                <View>
                  <Text style={tw`text-gray-400 text-xs uppercase`}>Member Since</Text>
                  <Text style={tw`text-gray-700 font-semibold mt-1`}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={tw`text-gray-400 text-xs uppercase`}>Role</Text>
                  <Text style={tw`text-gray-700 font-semibold mt-1`}>{user.role}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <Text style={tw`text-lg font-bold text-gray-800 mb-3 ml-1`}>Quick Actions</Text>
          <View style={tw`flex-row flex-wrap justify-between`}>
            {quickActions.map((item, index) => (
              <Card
                key={index}
                style={tw`w-[48%] bg-white rounded-xl mb-3`}
                elevation={2}
                onPress={item.onPress}
              >
                <Card.Content style={tw`items-center py-5`}>
                  <View style={[tw`p-3 rounded-full mb-2`, { backgroundColor: item.bgColor }]}>
                    <IconButton
                      icon={item.icon}
                      size={24}
                      iconColor={item.iconColor}
                      style={tw`m-0`}
                    />
                  </View>
                  <Text style={tw`font-semibold text-gray-700`}>{item.label}</Text>
                </Card.Content>
              </Card>
            ))}
          </View>

          {/* About Section */}
          <Card style={tw`bg-blue-50 rounded-xl mt-2 mb-4`} elevation={1}>
            <Card.Content style={tw`p-4`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-2`}>About This App</Text>
              <Text style={tw`text-gray-600 mb-2`}>
                BT01 - React Native app with authentication features.
              </Text>
              <View style={tw`ml-2`}>
                <Text style={tw`text-gray-600`}>• User Registration with OTP</Text>
                <Text style={tw`text-gray-600`}>• User Login with JWT</Text>
                <Text style={tw`text-gray-600`}>• Password Reset</Text>
                <Text style={tw`text-gray-600`}>• Persistent Session (AsyncStorage)</Text>
              </View>
              <Text style={tw`text-gray-400 text-xs mt-3 italic`}>
                Built with React Native, Expo, React Native Paper, Redux Toolkit & twrnc
              </Text>
            </Card.Content>
          </Card>

          {/* Logout Button */}
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={tw`rounded-xl border-2 border-red-200 bg-white`}
            textColor="#dc2626"
            icon="logout"
            contentStyle={tw`py-1`}
          >
            Log Out
          </Button>

          <Text style={tw`text-center text-gray-400 text-xs mt-4`}>
            App Version 1.0.0 • BT01 Assignment A03
          </Text>
        </View>
      </ScrollView>
    </Layout>
  );
}
