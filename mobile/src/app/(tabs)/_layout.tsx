import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, PlusSquare, Trophy, User } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { isDark } = useTheme();
  const { isAdmin } = useAuth();
  const insets = useSafeAreaInsets();

  const bottomInset = Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0095f6',
        tabBarInactiveTintColor: isDark ? '#71717a' : '#a1a1aa',
        tabBarStyle: {
          backgroundColor: isDark ? '#000000' : '#ffffff',
          borderTopColor: isDark ? '#27272a' : '#e4e4e7',
          borderTopWidth: 1,
          height: 52 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => <PlusSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? '/admin' : null,
          tabBarIcon: ({ color, size }) => <Trophy size={size} color="#f59e0b" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
