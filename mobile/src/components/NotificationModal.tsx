import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, X, Heart, MessageSquare, Award, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { socket } from '../services/socket';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'kyc' | 'winner';
  title: string;
  body: string;
  time: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'winner',
      title: '🏆 Contest Winner Update',
      body: 'The 33 Prize Cascade allocation engine has calculated weekly rankings!',
      time: '10m ago',
    },
    {
      id: '2',
      type: 'kyc',
      title: '🛡️ KYC Status Verified',
      body: 'Your Aadhaar document verification was reviewed and approved.',
      time: '1h ago',
    },
    {
      id: '3',
      type: 'like',
      title: '❤️ Reel Liked',
      body: 'Your latest video received new likes from creators in Chhattisgarh!',
      time: '3h ago',
    },
  ]);

  useEffect(() => {
    const handlePostUpdate = (data: any) => {
      if (data.likeCount) {
        setNotifications((prev) => [
          {
            id: Date.now().toString(),
            type: 'like',
            title: '⚡ Live Reel Update',
            body: `Post ${data.postId} updated with ${data.likeCount} likes & ${data.commentCount} comments.`,
            time: 'Just now',
          },
          ...prev,
        ]);
      }
    };

    socket.on('post_updated', handlePostUpdate);
    return () => {
      socket.off('post_updated', handlePostUpdate);
    };
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>
        {/* Header */}
        <View style={[styles.headerBar, isDark ? styles.darkBorder : styles.lightBorder]}>
          <View style={styles.headerLeft}>
            <Bell size={20} color="#0095f6" />
            <Text style={[styles.headerTitle, isDark ? styles.whiteText : styles.blackText]}>
              Notifications
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={isDark ? '#e4e4e7' : '#3f3f46'} />
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.notifItem, isDark ? styles.darkBorder : styles.lightBorder]}>
              <View style={styles.iconCircle}>
                {item.type === 'winner' && <Award size={20} color="#f59e0b" />}
                {item.type === 'kyc' && <CheckCircle2 size={20} color="#10b981" />}
                {item.type === 'like' && <Heart size={20} color="#f43f5e" />}
                {item.type === 'comment' && <MessageSquare size={20} color="#0095f6" />}
              </View>
              <View style={styles.textWrapper}>
                <View style={styles.titleRow}>
                  <Text style={[styles.itemTitle, isDark ? styles.whiteText : styles.blackText]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemTime, isDark ? styles.mutedDark : styles.mutedLight]}>
                    {item.time}
                  </Text>
                </View>
                <Text style={[styles.itemBody, isDark ? styles.mutedDark : styles.mutedLight]}>
                  {item.body}
                </Text>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  darkBorder: {
    borderBottomColor: '#27272a',
  },
  lightBorder: {
    borderBottomColor: '#e4e4e7',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  notifItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemTime: {
    fontSize: 11,
  },
  itemBody: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
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
