import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Camera, Trophy, Sun, Moon, Bell, Search, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { getMediaUrl } from '../config';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationModal } from './NotificationModal';
import { router } from 'expo-router';

export const Header: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <>
      <View style={[styles.headerContainer, isDark ? styles.darkHeader : styles.lightHeader]}>
        {/* Brand Logo & Name */}
        <TouchableOpacity
          style={styles.logoWrapper}
          onPress={() => router.push('/')}
          activeOpacity={0.7}
        >
          <View style={styles.iconRing}>
            <View style={[styles.iconInner, isDark ? styles.darkBg : styles.lightBg]}>
              <Camera size={18} color={isDark ? '#ffffff' : '#000000'} />
            </View>
          </View>
          <Text style={[styles.brandText, isDark ? styles.whiteText : styles.blackText]}>
            Contestify
          </Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Admin Command Center Link */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.adminBadge}
              onPress={() => router.push('/admin')}
              activeOpacity={0.8}
            >
              <Trophy size={14} color="#f59e0b" />
              <Text style={styles.adminText}>Admin</Text>
            </TouchableOpacity>
          )}

          {/* Search Trigger */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsSearchOpen(true)}
            activeOpacity={0.7}
          >
            <Search size={20} color={isDark ? '#e4e4e7' : '#3f3f46'} />
          </TouchableOpacity>

          {/* Notifications Trigger */}
          {user && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setIsNotifOpen(true)}
              activeOpacity={0.7}
            >
              <Bell size={20} color={isDark ? '#e4e4e7' : '#3f3f46'} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          )}

          {/* Theme Toggle */}
          <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme} activeOpacity={0.7}>
            {isDark ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#6366f1" />}
          </TouchableOpacity>

          {/* User Avatar or Logout */}
          {user ? (
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
            >
              {user.avatarUrl ? (
                <Image source={{ uri: getMediaUrl(user.avatarUrl) }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarFallback, isDark ? styles.darkFallback : styles.lightFallback]}>
                  <Text style={[styles.avatarText, isDark ? styles.whiteText : styles.blackText]}>
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/auth')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginBtnText}>Log In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Global Search Modal */}
      <GlobalSearchModal visible={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Notifications Modal */}
      <NotificationModal visible={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  darkHeader: {
    backgroundColor: '#000000',
    borderBottomColor: '#27272a',
  },
  lightHeader: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e4e4e7',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconRing: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#0095f6',
    padding: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 8.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkBg: {
    backgroundColor: '#000000',
  },
  lightBg: {
    backgroundColor: '#ffffff',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
    ...Platform.select({
      web: {
        fontFamily: '"Outfit", "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      android: {
        fontFamily: 'sans-serif-black',
      },
      ios: {
        fontFamily: 'System',
      },
    }),
  },
  whiteText: {
    color: '#ffffff',
  },
  blackText: {
    color: '#000000',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  adminText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  iconBtn: {
    padding: 6,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  avatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#0095f6',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkFallback: {
    backgroundColor: '#27272a',
  },
  lightFallback: {
    backgroundColor: '#e4e4e7',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  loginBtn: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
