import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Compass, Play, Heart, MessageSquare, X } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { PostCard } from '../../components/PostCard';
import { userApi } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { getMediaUrl, getMediaThumbnailUrl } from '../../config';

export default function ExploreScreen() {
  const { isDark } = useTheme();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      setLoading(true);
      const res = await userApi.get('/posts/feed', { params: { limit: 30 } });
      setPosts(res.data.data.posts || []);
    } catch (err) {
      console.error('Failed to fetch explore posts', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]} edges={['top', 'left', 'right', 'bottom']}>
      <Header />

      <View style={styles.content}>
        {/* Title */}
        <View style={styles.headerTitleRow}>
          <Compass size={20} color="#0095f6" />
          <Text style={[styles.title, isDark ? styles.whiteText : styles.blackText]}>
            Explore Reels Grid
          </Text>
        </View>

        {/* 3-Column Grid */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0095f6" />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item._id}
            numColumns={3}
            contentContainerStyle={styles.gridContainer}
            renderItem={({ item }) => {
              const mediaSource = getMediaUrl(item.mediaUrl);
              const coverSource = item.thumbnailUrl ? getMediaUrl(item.thumbnailUrl) : undefined;
              const isVideo = item.mediaType === 'video' || item.isVideo || item.mediaUrl?.match(/\.(mp4|mov|webm|mkv)$/i);
              const thumbnailUrl = getMediaThumbnailUrl(item.mediaUrl, item.thumbnailUrl);

              return (
                <TouchableOpacity
                  style={styles.gridCard}
                  onPress={() => setSelectedPost(item)}
                  activeOpacity={0.8}
                >
                  {coverSource ? (
                    <Image source={{ uri: coverSource }} style={styles.gridImage} resizeMode="cover" />
                  ) : isVideo && Platform.OS === 'web' && thumbnailUrl.match(/\.(mp4|mov|webm|mkv)$/i) ? (
                    <video
                      src={mediaSource}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <Image source={{ uri: thumbnailUrl }} style={styles.gridImage} resizeMode="cover" />
                  )}

                  {isVideo && (
                    <View style={styles.playBadge}>
                      <Play size={12} color="#ffffff" style={{ marginLeft: 1 }} />
                    </View>
                  )}

                  <View style={styles.overlayInfo}>
                    <View style={styles.statRow}>
                      <Heart size={10} color="#ffffff" fill="#ffffff" />
                      <Text style={styles.statText}>{item.likeCount || 0}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <MessageSquare size={10} color="#ffffff" fill="#ffffff" />
                      <Text style={styles.statText}>{item.commentCount || 0}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Reel Preview Modal */}
      {selectedPost && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setSelectedPost(null)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPost(null)}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.modalCard}>
              <PostCard post={selectedPost} />
            </View>
          </View>
        </Modal>
      )}
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
  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  gridContainer: {
    gap: 4,
  },
  gridCard: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#18181b',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 8,
  },
  overlayInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 50,
    padding: 8,
  },
  modalCard: {
    width: '100%',
    alignItems: 'center',
  },
  whiteText: {
    color: '#ffffff',
  },
  blackText: {
    color: '#000000',
  },
});
