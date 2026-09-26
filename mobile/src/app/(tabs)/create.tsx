import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { CreatePostModal } from '../../components/CreatePostModal';
import { useTheme } from '../../context/ThemeContext';
import { router } from 'expo-router';

export default function CreateScreen() {
  const { isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(true);

  const handleClose = () => {
    setModalVisible(false);
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>
      <Header />
      <CreatePostModal
        visible={modalVisible}
        onClose={handleClose}
        onPostCreated={() => {
          setModalVisible(false);
          router.replace('/');
        }}
      />
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
});
