import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { paperTheme } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PaperProvider theme={paperTheme}>
          <AppNavigator />
          <StatusBar style="auto" />
        </PaperProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
