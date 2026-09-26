import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlusCircle, Filter, CheckCircle2 } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { PostCard } from '../../components/PostCard';
import { CreatePostModal } from '../../components/CreatePostModal';
import { userApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { socket } from '../../services/socket';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchFeedPosts,
  setSelectedCategory,
  setActivePostId,
  toggleMute,
  updatePostStats,
} from '../../redux/slices/feedSlice';

const CATEGORIES = [
  'ALL',
  'Tech',
  'Art',
  'Music',
  'Gaming',
  'Fitness',
  'Food',
  'Travel',
  'Fashion',
  'Education',
  'Entertainment',
];

export default function FeedScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const { posts, activePostId, selectedCategory, page, hasMore, loading, refreshing, isFallback, isMuted } =
    useAppSelector((state) => state.feed);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewBuffer, setViewBuffer] = useState<string[]>([]);

  const loggedViewsRef = React.useRef<Set<string>>(new Set());

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<any> }) => {
      if (viewableItems && viewableItems.length > 0) {
        const activeItem = viewableItems.find((v) => v.isViewable) || viewableItems[0];
        if (activeItem && activeItem.item) {
          const id = activeItem.item._id;
          dispatch(setActivePostId(id));
          if (!loggedViewsRef.current.has(id)) {
            loggedViewsRef.current.add(id);
            setViewBuffer((prev) => [...prev, id]);
          }
        }
      }
    },
    [dispatch]
  );

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  useEffect(() => {
    dispatch(fetchFeedPosts({ page: 1, category: selectedCategory, append: false }));
  }, [selectedCategory, dispatch]);

  // Flush view buffer periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (viewBuffer.length > 0) {
        try {
          await userApi.post('/posts/batch-view', { postIds: viewBuffer });
          setViewBuffer([]);
        } catch (err) {
          console.error('Failed to log batch views', err);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [viewBuffer]);

  // Listen for socket real-time post updates
  useEffect(() => {
    const handlePostUpdated = (data: any) => {
      dispatch(updatePostStats(data));
    };

    socket.on('post_updated', handlePostUpdated);
    return () => {
      socket.off('post_updated', handlePostUpdated);
    };
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchFeedPosts({ page: 1, category: selectedCategory, append: false }));
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      dispatch(fetchFeedPosts({ page: page + 1, category: selectedCategory, append: true }));
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Navigation Header */}
      <Header />

      {/* Main Feed Container */}
      <View style={styles.feedWrapper}>
        {/* Banner & Category Filter Bar */}
        <View style={styles.topSection}>
          <View style={styles.bannerRow}>
            <View>
              <Text style={[styles.title, isDark ? styles.whiteText : styles.blackText]}>
                Reels Feed
              </Text>
              <Text style={[styles.subtitle, isDark ? styles.mutedDark : styles.mutedLight]}>
                Watch top content from creators in real-time.
              </Text>
            </View>

            {user && (
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => setIsModalOpen(true)}
                activeOpacity={0.8}
              >
                <PlusCircle size={14} color="#ffffff" />
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Horizontal Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            <Filter size={14} color={isDark ? '#a1a1aa' : '#71717a'} style={{ marginTop: 8 }} />
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catPill,
                  selectedCategory === cat
                    ? styles.catPillActive
                    : isDark
                    ? styles.catPillDark
                    : styles.catPillLight,
                ]}
                onPress={() => dispatch(setSelectedCategory(cat))}
              >
                <Text
                  style={[
                    styles.catText,
                    selectedCategory === cat
                      ? styles.catTextActive
                      : isDark
                      ? styles.whiteText
                      : styles.blackText,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Vertical Feed List */}
        {loading && posts.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0095f6" />
            <Text style={[styles.loadingText, isDark ? styles.mutedDark : styles.mutedLight]}>
              Loading Reels...
            </Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyTitle, isDark ? styles.whiteText : styles.blackText]}>
              No Posts Found
            </Text>
            <Text style={[styles.emptySub, isDark ? styles.mutedDark : styles.mutedLight]}>
              No reels available in {selectedCategory} yet.
            </Text>
            {user && (
              <TouchableOpacity
                style={styles.firstPostBtn}
                onPress={() => setIsModalOpen(true)}
              >
                <Text style={styles.firstPostText}>Be the first to post</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => {
              const isActive = activePostId ? item._id === activePostId : index === 0;
              return (
                <PostCard
                  post={item}
                  isActive={isActive}
                  isMuted={isMuted}
                  onToggleMute={() => dispatch(toggleMute())}
                />
              );
            }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews={Platform.OS === 'android'}
            getItemLayout={(_data, index) => {
              const itemHeight = Math.min(Dimensions.get('window').height - 130, 720) + 12;
              return { length: itemHeight, offset: itemHeight * index, index };
            }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#0095f6"
              />
            }
            ListFooterComponent={
              isFallback ? (
                <View style={styles.fallbackBadge}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <Text style={styles.fallbackText}>
                    You've seen all new reels! Suggesting top reels.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Create Reel Modal */}
      <CreatePostModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={() => dispatch(fetchFeedPosts({ page: 1, category: selectedCategory, append: false }))}
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
  feedWrapper: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
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
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0095f6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  catScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  catPillActive: {
    backgroundColor: '#0095f6',
    borderColor: '#0095f6',
  },
  catPillDark: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  catPillLight: {
    backgroundColor: '#f4f4f5',
    borderColor: '#e4e4e7',
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
  },
  catTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  firstPostBtn: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  firstPostText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fallbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    marginVertical: 12,
  },
  fallbackText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
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
