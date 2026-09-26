import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { AdminComponents } from '../../components/AdminComponents';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function AdminScreen() {
  const { isAdmin } = useAuth();
  const { isDark } = useTheme();

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]} edges={['top', 'left', 'right', 'bottom']}>
        <Header />
        <View style={styles.centerBox}>
          <Text style={[styles.errorTitle, isDark ? styles.whiteText : styles.blackText]}>
            Access Restricted
          </Text>
          <Text style={[styles.errorSub, isDark ? styles.mutedDark : styles.mutedLight]}>
            You must be logged in as an Administrator to view the Contestify Command Center.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]} edges={['top', 'left', 'right', 'bottom']}>
      <Header />
      <AdminComponents />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkBg: {
    backgroundColor: '#000000',
  },
  lightBg: {
    backgroundColor: '#ffffff',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  whiteText: {
    color: '#ffffff',
  },
  blackText: {
    color: '#000000',
  },
  mutedDark: {
    color: '#a1a1aa',
  },
  mutedLight: {
    color: '#71717a',
  },
});
