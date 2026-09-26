import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
  Platform,
  Pressable,
  AppState,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePathname, useFocusEffect, router } from 'expo-router';
import {
  Heart,
  MessageSquare,
  Eye,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  MoreVertical,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../services/api';
import { getMediaUrl, getMediaThumbnailUrl } from '../config';
import { CommentsModal } from './CommentsModal';

interface PostCardProps {
  post: any;
  isActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

const formatCount = (num: number) => {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

interface ActiveVideoPlayerProps {
  source: string;
  shouldPlay: boolean;
  isMuted: boolean;
}

const ActiveVideoPlayer: React.FC<ActiveVideoPlayerProps> = React.memo(({ source, shouldPlay, isMuted }) => {
  const player = useVideoPlayer(source, (p) => {
    try {
      p.loop = true;
      p.muted = isMuted;
    } catch (err) {}
  });

  useEffect(() => {
    if (player) {
      try {
        player.muted = isMuted;
      } catch (err) {}
    }
  }, [isMuted, player]);

  useEffect(() => {
    if (!player) return;
    try {
      if (shouldPlay) {
        if (!player.playing) {
          const promise: any = player.play();
          if (promise && typeof promise.catch === 'function') {
            promise.catch((err: any) => {
              if (err?.name !== 'AbortError') {
                // Ignore DOM play interruption abort errors caused by fast scrolling
              }
            });
          }
        }
      } else {
        if (player.playing) {
          player.pause();
        }
      }
    } catch (err) {}

    return () => {
      try {
        if (player && player.playing) {
          player.pause();
        }
      } catch (e) {}
    };
  }, [shouldPlay, player]);

  return (
    <VideoView
      player={player}
      style={styles.videoPlayer}
      nativeControls={false}
      contentFit="cover"
      allowsPictureInPicture={false}
    />
  );
});

const PostCardComponent: React.FC<PostCardProps> = ({
  post,
  isActive = true,
  isMuted: isMutedProp,
  onToggleMute,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const pathname = usePathname();

  const [isScreenFocused, setIsScreenFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  const [isPlaying, setIsPlaying] = useState(true);
  const [isAppActive, setIsAppActive] = useState(true);
  const [internalMuted, setInternalMuted] = useState(true);
  const isMuted = isMutedProp !== undefined ? isMutedProp : internalMuted;
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const showOverlay = isHovered || !isPlaying || isCommentsOpen;

  const mediaSource = useMemo(() => getMediaUrl(post.mediaUrl), [post.mediaUrl]);
  const posterSource = useMemo(
    () => getMediaThumbnailUrl(post.mediaUrl, post.thumbnailUrl),
    [post.mediaUrl, post.thumbnailUrl]
  );
  const isVideo = useMemo(
    () => post.mediaType === 'video' || post.isVideo || post.mediaUrl?.match(/\.(mp4|mov|webm|mkv)$/i),
    [post.mediaType, post.isVideo, post.mediaUrl]
  );

  const safeMediaSource = useMemo(
    () =>
      mediaSource && typeof mediaSource === 'string' && mediaSource.trim().length > 0
        ? mediaSource
        : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    [mediaSource]
  );

  // Track app state and window/tab visibility changes
  useEffect(() => {
    const handleAppStateChange = (nextState: string) => {
      setIsAppActive(nextState === 'active');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const handleVisibilityChange = () => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        setIsAppActive(document.visibilityState === 'visible');
      }
    };

    const handleWindowBlur = () => setIsAppActive(false);
    const handleWindowFocus = () => setIsAppActive(true);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('focus', handleWindowFocus);
    }

    return () => {
      subscription.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('focus', handleWindowFocus);
      }
    };
  }, []);

  const shouldPlay = isActive && isScreenFocused && isAppActive;

  useEffect(() => {
    setHasLiked(post.hasLiked || false);
    setLikeCount(post.likeCount || 0);
    setCommentCount(post.commentCount || 0);
  }, [post]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    if (onToggleMute) {
      onToggleMute();
    } else {
      setInternalMuted((prev) => !prev);
    }
  }, [onToggleMute]);

  const handleLike = useCallback(async () => {
    if (!user) {
      toast.warning('Please log in to like reels!', 'Authentication Required');
      return;
    }

    const postOwnerId = post.userId?._id || post.userId?.id || post.userId;
    const currentUserId = user._id || user.id;
    if (postOwnerId && currentUserId && postOwnerId.toString() === currentUserId.toString()) {
      toast.error('You cannot like your own post!', 'Action Restricted');
      return;
    }

    const nextLiked = !hasLiked;
    setHasLiked(nextLiked);
    setLikeCount((prev: number) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await userApi.post(`/posts/${post._id}/like`);
      if (res.data.data.hasLiked) {
        toast.success('Post liked!', 'Liked');
      } else {
        toast.info('Like removed!', 'Unliked');
      }
    } catch (err: any) {
      setHasLiked(!nextLiked);
      setLikeCount((prev: number) => (nextLiked ? Math.max(0, prev - 1) : prev + 1));
      toast.error(err.response?.data?.message || 'Failed to toggle like', 'Error');
    }
  }, [user, post, hasLiked, toast]);

  const handleShare = useCallback(async () => {
    try {
      const usernameSlug =
        post.userId?.username || post.userId?.email?.split('@')[0] || post.userId?._id;
      const shareUrl = `https://contestify.app/profile/${usernameSlug}`;

      await Share.share({
        message: `Watch this reel on Contestify by @${usernameSlug}: ${post.caption}`,
        url: shareUrl,
      });
      toast.success('Reel shared!', 'Share Link');
    } catch (err) {
      toast.info('Reel link copied!', 'Share Link');
    }
  }, [post, toast]);

  const postOwnerId = useMemo(() => post.userId?._id || post.userId?.id || post.userId, [post.userId]);
  const usernameSlug = useMemo(
    () => post.userId?.username || (post.userId?.email ? post.userId.email.split('@')[0] : null) || 'creator',
    [post.userId]
  );
  const currentUserId = useMemo(() => user?._id || user?.id, [user]);
  const isOwnPost = useMemo(
    () => postOwnerId && currentUserId && postOwnerId.toString() === currentUserId.toString(),
    [postOwnerId, currentUserId]
  );
  const avatarUrlToUse = useMemo(
    () => post.userId?.avatarUrl || (isOwnPost ? user?.avatarUrl : null),
    [post.userId?.avatarUrl, isOwnPost, user?.avatarUrl]
  );

  return (
    <View style={styles.cardContainer}>
      {/* Central Reel Aspect Box with Hover Detection */}
      <Pressable
        style={styles.reelBox}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        {...({
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        } as any)}
      >
        {/* Top Header Overlay */}
        <View
          style={[styles.topOverlay, { opacity: showOverlay ? 1 : 0, pointerEvents: (showOverlay ? 'auto' : 'none') as any }]}
        >
          <View style={styles.topLeftControls}>
            <TouchableOpacity style={styles.topControlBtn} onPress={togglePlay}>
              {isPlaying ? <Pause size={18} color="#ffffff" /> : <Play size={18} color="#ffffff" />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.topControlBtn} onPress={toggleMute}>
              {isMuted ? <VolumeX size={18} color="#f43f5e" /> : <Volume2 size={18} color="#10b981" />}
            </TouchableOpacity>
          </View>

          <View style={styles.topRightControls}>
            <View style={styles.catPill}>
              <Text style={styles.catPillText}>{post.category || 'Reel'}</Text>
            </View>
            <TouchableOpacity style={styles.topControlBtn} onPress={handleShare}>
              <MoreVertical size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Video / Image Content */}
        {post.mediaType === 'video' || isVideo ? (
          <TouchableOpacity style={styles.mediaTouch} activeOpacity={0.9} onPress={togglePlay}>
            {posterSource ? (
              Platform.OS === 'web' && posterSource.match(/\.(mp4|mov|webm|mkv|avi)$/i) ? (
                <video
                  src={posterSource}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }}
                  preload="metadata"
                  muted
                />
              ) : (
                <ExpoImage
                  source={{ uri: posterSource }}
                  style={styles.imagePlayer}
                  contentFit="cover"
                  cachePolicy="disk"
                  transition={200}
                />
              )
            ) : (
              <View style={[styles.imagePlayer, { backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }]}>
                <Play size={44} color="#374151" />
              </View>
            )}
            {shouldPlay ? (
              <ActiveVideoPlayer
                source={safeMediaSource}
                shouldPlay={shouldPlay && isPlaying}
                isMuted={isMuted}
              />
            ) : null}
            {!isPlaying && (
              <View style={styles.pauseOverlay}>
                <View style={styles.playIconCircle}>
                  <Play size={32} color="#ffffff" style={{ marginLeft: 4 }} />
                </View>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          mediaSource ? (
            <ExpoImage
              source={{ uri: mediaSource }}
              style={styles.imagePlayer}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
            />
          ) : null
        )}

        {/* Bottom Creator Overlay */}
        <View
          style={[styles.bottomOverlay, { opacity: showOverlay ? 1 : 0, pointerEvents: (showOverlay ? 'auto' : 'none') as any }]}
        >
          <View style={styles.creatorRow}>
            <TouchableOpacity
              style={styles.avatarTouch}
              onPress={() => router.push(`/profile/${usernameSlug}`)}
            >
              <View style={styles.avatarRing}>
                {avatarUrlToUse ? (
                  <ExpoImage
                    source={{ uri: getMediaUrl(avatarUrlToUse) }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarLetter}>
                      {post.userId?.name ? post.userId.name[0].toUpperCase() : 'C'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.creatorName} numberOfLines={1}>
                @{usernameSlug}
              </Text>
            </TouchableOpacity>

            {!isOwnPost && (
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={() => setIsFollowing(!isFollowing)}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.captionText} numberOfLines={2}>
            {post.caption}
          </Text>

          <View style={styles.audioRow}>
            <Music size={12} color="#38bdf8" />
            <Text style={styles.audioText} numberOfLines={1}>
              Original audio - {post.userId?.name || usernameSlug}
            </Text>
          </View>
        </View>

        {/* Floating Right Action Bar */}
        <View
          style={[styles.floatingActionBar, { opacity: showOverlay ? 1 : 0, pointerEvents: (showOverlay ? 'auto' : 'none') as any }]}
        >
          {/* Like */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <View style={[styles.actionCircle, hasLiked && styles.likedCircle]}>
              <Heart size={20} color={hasLiked ? '#f43f5e' : '#ffffff'} fill={hasLiked ? '#f43f5e' : 'transparent'} />
            </View>
            <Text style={styles.actionCount}>{formatCount(likeCount)}</Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => setIsCommentsOpen(true)}>
            <View style={styles.actionCircle}>
              <MessageSquare size={20} color="#ffffff" />
            </View>
            <Text style={styles.actionCount}>{formatCount(commentCount)}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <View style={styles.actionCircle}>
              <Share2 size={20} color="#ffffff" />
            </View>
            <Text style={styles.actionCount}>Share</Text>
          </TouchableOpacity>

          {/* Views */}
          <View style={styles.actionBtn}>
            <View style={styles.actionCircle}>
              <Eye size={18} color="#34d399" />
            </View>
            <Text style={styles.actionCount}>{formatCount(post.viewCount || 0)}</Text>
          </View>
        </View>
      </Pressable>

      {/* Comments Bottom Sheet Modal - Lazy Mounted */}
      {isCommentsOpen ? (
        <CommentsModal
          visible={isCommentsOpen}
          post={post}
          onClose={() => setIsCommentsOpen(false)}
          onCommentAdded={() => setCommentCount((prev: number) => prev + 1)}
        />
      ) : null}
    </View>
  );
};

export const PostCard = React.memo(PostCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.post._id === nextProps.post._id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isMuted === nextProps.isMuted &&
    prevProps.post.likeCount === nextProps.post.likeCount &&
    prevProps.post.commentCount === nextProps.post.commentCount &&
    prevProps.post.hasLiked === nextProps.post.hasLiked
  );
});

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: Math.min(height - 130, 720),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  reelBox: {
    width: '100%',
    maxWidth: 400,
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#27272a',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 24px rgba(0,0,0,0.5)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
      },
    }),
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        transition: 'opacity 0.25s ease-in-out',
      },
    }),
  },
  topLeftControls: {
    flexDirection: 'row',
    gap: 8,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topControlBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  catPill: {
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  catPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mediaTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  videoPlayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  imagePlayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  playIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 60,
    zIndex: 20,
    padding: 14,
    backgroundColor: 'transparent',
    gap: 6,
    ...Platform.select({
      web: {
        transition: 'opacity 0.25s ease-in-out',
      },
    }),
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0095f6',
    padding: 1.5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  creatorName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    ...Platform.select({
      web: {
        textShadow: '0px 1px 3px rgba(0, 0, 0, 0.8)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  followBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followingBtn: {
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  followBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  followingBtnText: {
    color: '#ffffff',
  },
  captionText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 3px rgba(0, 0, 0, 0.8)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioText: {
    color: '#ffffff',
    fontSize: 11,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 3px rgba(0, 0, 0, 0.8)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  floatingActionBar: {
    position: 'absolute',
    bottom: 16,
    right: 12,
    zIndex: 30,
    gap: 14,
    alignItems: 'center',
    ...Platform.select({
      web: {
        transition: 'opacity 0.25s ease-in-out',
      },
    }),
  },
  actionBtn: {
    alignItems: 'center',
    gap: 2,
  },
  actionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likedCircle: {
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  actionCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
