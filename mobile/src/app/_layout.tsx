import '../../global.css';
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { ErrorBoundary } from '../components/ErrorBoundary';
import AuthScreen from './auth';

function RootLayoutContent() {
  const { isDark } = useTheme();
  const { user, loading } = useAuth();

  // 1. Loading screen while reading token from storage
  if (loading) {
    return (
      <View style={[styles.centerContainer, isDark ? styles.darkBg : styles.lightBg]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>⚡</Text>
        </View>
        <Text style={[styles.appName, isDark ? styles.whiteText : styles.blackText]}>
          Contestify
        </Text>
        <ActivityIndicator size="large" color="#0095f6" style={styles.spinner} />
      </View>
    );
  }

  // 2. Strict Authentication Wall: If user is not logged in, force AuthScreen
  if (!user) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthScreen />
      </>
    );
  }

  // 3. Authenticated App Flow
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="profile/[identifier]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <RootLayoutContent />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  darkBg: {
    backgroundColor: '#000000',
  },
  lightBg: {
    backgroundColor: '#ffffff',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  spinner: {
    marginTop: 16,
  },
  whiteText: {
    color: '#ffffff',
  },
  blackText: {
    color: '#000000',
  },
});
