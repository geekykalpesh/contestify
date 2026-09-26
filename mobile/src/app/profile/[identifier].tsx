import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Grid,
  List,
  Mail,
  CheckCircle2,
  MapPin,
  Play,
  Heart,
  MessageSquare,
  ChevronLeft,
  X,
} from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Header } from '../../components/Header';
import { PostCard } from '../../components/PostCard';
import { useTheme } from '../../context/ThemeContext';
import { userApi } from '../../services/api';
import { getMediaUrl, getMediaThumbnailUrl } from '../../config';

export default function PublicProfileScreen() {
  const { identifier } = useLocalSearchParams();
  const rawIdentifier = Array.isArray(identifier) ? identifier[0] : identifier;
  const profileIdentifier = rawIdentifier ? rawIdentifier.replace(/^@/, '').trim() : '';

  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'grid' | 'feed'>('grid');
  const [profileUser, setProfileUser] = useState<any | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    if (profileIdentifier) {
      fetchUserProfile();
    }
  }, [profileIdentifier]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await userApi.get(`/posts/user/${encodeURIComponent(profileIdentifier)}`);
      setProfileUser(res.data.data?.user || null);
      setUserPosts(res.data.data?.posts || []);
      setStats(res.data.data?.stats || {});
    } catch (err) {
      console.error('Failed to fetch public profile', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>
        <Header />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0095f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>
        <Header />
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyTitle, isDark ? styles.whiteText : styles.blackText]}>
            Creator Not Found
          </Text>
          <Text style={[styles.emptySub, isDark ? styles.mutedDark : styles.mutedLight]}>
            The profile @{profileIdentifier} could not be found.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const kycStatus = profileUser.kycDetails?.status || 'NOT_SUBMITTED';

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]} edges={['top', 'left', 'right', 'bottom']}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>

        {/* Profile Box */}
        <View style={[styles.profileHeaderCard, isDark ? styles.darkCard : styles.lightCard]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarRing}>
              {profileUser.avatarUrl ? (
                <Image source={{ uri: getMediaUrl(profileUser.avatarUrl) }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>
                    {profileUser.name ? profileUser.name[0].toUpperCase() : 'C'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerDetails}>
              <View style={styles.nameRow}>
                <Text style={[styles.userNameText, isDark ? styles.whiteText : styles.blackText]}>
                  {profileUser.name}
                </Text>
                {kycStatus === 'PASSED' && (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle2 size={12} color="#10b981" />
                    <Text style={styles.verifiedText}>KYC Verified</Text>
                  </View>
                )}
              </View>

              <Text style={styles.usernamePill}>
                @{profileUser.username || profileUser.email?.split('@')[0]}
              </Text>

              <View style={styles.emailRow}>
                <MapPin size={12} color="#a1a1aa" />
                <Text style={[styles.emailText, isDark ? styles.mutedDark : styles.mutedLight]}>
                  {profileUser.residency || 'Creator'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={() => setIsFollowing(!isFollowing)}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={[styles.statsRow, isDark ? styles.darkBorder : styles.lightBorder]}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, isDark ? styles.whiteText : styles.blackText]}>
                {stats.totalPosts || 0}
              </Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, isDark ? styles.whiteText : styles.blackText]}>
                {profileUser.followers || 0}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#f43f5e' }]}>
                {stats.totalLikes || 0}
              </Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#10b981' }]}>
                {stats.totalViews || 0}
              </Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>
        </View>

        {/* Tab Selection Bar */}
        <View style={[styles.tabsBar, isDark ? styles.darkBorder : styles.lightBorder]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'grid' && styles.activeTabBtn]}
            onPress={() => setActiveTab('grid')}
          >
            <Grid size={16} color={activeTab === 'grid' ? '#0095f6' : '#71717a'} />
            <Text style={[styles.tabBtnText, activeTab === 'grid' && styles.activeTabText]}>
              Grid ({userPosts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'feed' && styles.activeTabBtn]}
            onPress={() => setActiveTab('feed')}
          >
            <List size={16} color={activeTab === 'feed' ? '#0095f6' : '#71717a'} />
            <Text style={[styles.tabBtnText, activeTab === 'feed' && styles.activeTabText]}>
              Reels
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grid View */}
        {activeTab === 'grid' && (
          <View style={styles.gridWrapper}>
            {userPosts.map((post) => {
              const mediaSource = getMediaUrl(post.mediaUrl);
              const coverSource = post.thumbnailUrl ? getMediaUrl(post.thumbnailUrl) : undefined;
              const isVideo = post.mediaType === 'video' || post.isVideo || post.mediaUrl?.match(/\.(mp4|mov|webm|mkv)$/i);
              const thumbnailUrl = getMediaThumbnailUrl(post.mediaUrl, post.thumbnailUrl);

              return (
                <TouchableOpacity
                  key={post._id || post.id}
                  style={styles.gridThumb}
                  onPress={() => setSelectedPost(post)}
                  activeOpacity={0.8}
                >
                  {coverSource ? (
                    <Image source={{ uri: coverSource }} style={styles.thumbImage} resizeMode="cover" />
                  ) : isVideo && Platform.OS === 'web' && thumbnailUrl.match(/\.(mp4|mov|webm|mkv)$/i) ? (
                    <video
                      src={mediaSource}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <Image source={{ uri: thumbnailUrl }} style={styles.thumbImage} resizeMode="cover" />
                  )}

                  {isVideo && (
                    <View style={styles.playBadge}>
                      <Play size={10} color="#ffffff" style={{ marginLeft: 1 }} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Feed View */}
        {activeTab === 'feed' && (
          <View>
            {userPosts.map((post, index) => (
              <PostCard key={post._id} post={post} isActive={index === 0} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Reel Modal */}
      {selectedPost && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setSelectedPost(null)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedPost(null)}>
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
  scrollContainer: {
    padding: 16,
    gap: 16,
  },
  backBtn: {
    paddingVertical: 4,
  },
  profileHeaderCard: {
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  darkCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  lightCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0095f6',
    padding: 2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerDetails: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userNameText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  usernamePill: {
    fontSize: 11,
    color: '#0095f6',
    fontWeight: 'bold',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emailText: {
    fontSize: 11,
  },
  followBtn: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followingBtn: {
    backgroundColor: '#27272a',
  },
  followBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  followingBtnText: {
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  darkBorder: {
    borderTopColor: '#27272a',
    borderBottomColor: '#27272a',
  },
  lightBorder: {
    borderTopColor: '#e4e4e7',
    borderBottomColor: '#e4e4e7',
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: '#a1a1aa',
    textTransform: 'uppercase',
  },
  tabsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeTabBtn: {
    borderBottomWidth: 2,
    borderBottomColor: '#0095f6',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#71717a',
  },
  activeTabText: {
    color: '#0095f6',
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gridThumb: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#18181b',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 3,
    borderRadius: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#0095f6',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
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
  mutedDark: {
    color: '#a1a1aa',
  },
  mutedLight: {
    color: '#71717a',
  },
});
