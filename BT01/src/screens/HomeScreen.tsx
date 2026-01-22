import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import Layout from '../components/Layout';
import type { RootState } from '../store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigation.replace('Login');
  };

  if (!user) {
    return (
      <Layout>
        <View style={styles.centerContainer}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.errorTitle}>Error</Title>
              <Paragraph>No user data found. Please log in again.</Paragraph>
              <Button mode="contained" onPress={handleLogout} style={styles.button}>
                Go to Login
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Welcome to BT01!</Title>
            <Paragraph style={styles.subtitle}>You are successfully logged in</Paragraph>

            <Divider style={styles.divider} />

            <View style={styles.infoSection}>
              <Title style={styles.sectionTitle}>User Information</Title>

              <View style={styles.infoRow}>
                <Paragraph style={styles.infoLabel}>Name:</Paragraph>
                <Paragraph style={styles.infoValue}>{user.name}</Paragraph>
              </View>

              <View style={styles.infoRow}>
                <Paragraph style={styles.infoLabel}>Email:</Paragraph>
                <Paragraph style={styles.infoValue}>{user.email}</Paragraph>
              </View>

              <View style={styles.infoRow}>
                <Paragraph style={styles.infoLabel}>User ID:</Paragraph>
                <Paragraph style={styles.infoValue}>{user.id}</Paragraph>
              </View>

              {user.createdAt && (
                <View style={styles.infoRow}>
                  <Paragraph style={styles.infoLabel}>Member Since:</Paragraph>
                  <Paragraph style={styles.infoValue}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Paragraph>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.button}
              icon="logout"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>

        <Card style={[styles.card, styles.introCard]}>
          <Card.Content>
            <Title style={styles.sectionTitle}>About This App</Title>
            <Paragraph>
              This is BT01 - a React Native application with simple authentication features.
            </Paragraph>
            <Paragraph style={styles.featureItem}>• User Registration</Paragraph>
            <Paragraph style={styles.featureItem}>• User Login</Paragraph>
            <Paragraph style={styles.featureItem}>• User Profile</Paragraph>
            <Paragraph style={styles.techStack}>
              Built with React Native, Expo, React Native Paper, and Redux Toolkit.
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    elevation: 4,
    marginBottom: 16,
  },
  introCard: {
    backgroundColor: '#e3f2fd',
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  errorTitle: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  infoSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120,
    color: '#555',
  },
  infoValue: {
    flex: 1,
    color: '#333',
  },
  button: {
    marginTop: 8,
  },
  featureItem: {
    marginLeft: 8,
    marginTop: 4,
  },
  techStack: {
    marginTop: 12,
    fontStyle: 'italic',
    color: '#666',
    fontSize: 12,
  },
});
