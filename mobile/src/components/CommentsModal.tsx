import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Send,
  Trash2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { getMediaUrl } from '../config';

interface CommentsModalProps {
  visible: boolean;
  post: any;
  onClose: () => void;
  onCommentAdded?: () => void;
}

const AVATAR_COLORS = [
  '#d97706', // amber
  '#059669', // emerald
  '#0284c7', // sky
  '#4f46e5', // indigo
  '#9333ea', // purple
  '#e11d48', // rose
  '#0d9488', // teal
  '#ea580c', // orange
];

export const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  post,
  onClose,
  onCommentAdded,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Interactive likes & dislikes state
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [dislikedComments, setDislikedComments] = useState<Record<string, boolean>>({});
  const [commentLikesMap, setCommentLikesMap] = useState<Record<string, number>>({});

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && post?._id) {
      fetchComments();
    }
  }, [visible, post?._id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await userApi.get(`/posts/${post._id}/comments`);
      const rawData = res.data.data;
      const commentsData = Array.isArray(rawData) ? rawData : rawData?.comments || [];
      setComments(commentsData);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      toast.warning('Please login to comment on reels!', 'Authentication Required');
      return;
    }
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const res = await userApi.post(`/posts/${post._id}/comment`, { text: newComment.trim() });
      const added = res.data.data;
      setComments((prev) => [added, ...prev]);
      setNewComment('');
      toast.success('Comment added!', 'Success');
      fetchComments();
      if (onCommentAdded) onCommentAdded();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add comment', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await userApi.delete(`/posts/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.info('Comment deleted', 'Deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete comment', 'Error');
    }
  };

  const handleToggleLikeComment = (commentId: string, initialLikes: number) => {
    setLikedComments((prev) => {
      const isCurrentlyLiked = !!prev[commentId];
      const newLikedState = !isCurrentlyLiked;

      if (newLikedState) {
        setDislikedComments((dPrev) => ({ ...dPrev, [commentId]: false }));
      }

      setCommentLikesMap((lPrev) => {
        const currentCount = lPrev[commentId] !== undefined ? lPrev[commentId] : initialLikes;
        return {
          ...lPrev,
          [commentId]: newLikedState ? currentCount + 1 : Math.max(0, currentCount - 1),
        };
      });

      return { ...prev, [commentId]: newLikedState };
    });
  };

  const handleToggleDislikeComment = (commentId: string) => {
    setDislikedComments((prev) => {
      const isCurrentlyDisliked = !!prev[commentId];
      const newDislikedState = !isCurrentlyDisliked;

      if (newDislikedState && likedComments[commentId]) {
        setLikedComments((lPrev) => ({ ...lPrev, [commentId]: false }));
        setCommentLikesMap((lPrev) => ({
          ...lPrev,
          [commentId]: Math.max(0, (lPrev[commentId] || 1) - 1),
        }));
      }

      return { ...prev, [commentId]: newDislikedState };
    });
  };

  const handleReplyClick = (usernameTag: string) => {
    setNewComment(`@${usernameTag} `);
    inputRef.current?.focus();
  };

  const handleToggleSort = () => {
    const nextSort = sortBy === 'top' ? 'newest' : 'top';
    setSortBy(nextSort);
    toast.info(
      nextSort === 'top' ? 'Sorting by Top Comments' : 'Sorting by Newest Comments',
      'Comments Sorted'
    );
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  if (!post) return null;

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return (b.text?.length || 0) - (a.text?.length || 0);
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.modalCard, isDark ? styles.darkCard : styles.lightCard]}>
          {/* Top Drag Handle Bar */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={[styles.header, isDark ? styles.darkBorder : styles.lightBorder]}>
            <View style={styles.headerTitleRow}>
              <MessageSquare size={18} color="#0095f6" />
              <Text style={[styles.headerTitle, isDark ? styles.whiteText : styles.blackText]}>
                Comments ({comments.length})
              </Text>
            </View>

            <View style={styles.headerActionRow}>
              <TouchableOpacity
                onPress={handleToggleSort}
                style={[
                  styles.iconBtn,
                  sortBy === 'newest' && styles.activeIconBtn,
                  isDark ? styles.darkIconBtn : styles.lightIconBtn,
                ]}
              >
                <SlidersHorizontal
                  size={16}
                  color={sortBy === 'newest' ? '#0095f6' : isDark ? '#a1a1aa' : '#71717a'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.iconBtn, isDark ? styles.darkIconBtn : styles.lightIconBtn]}
              >
                <X size={18} color={isDark ? '#e4e4e7' : '#3f3f46'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sorting info badge */}
          <View style={[styles.sortBadgeRow, isDark ? styles.darkBadgeRow : styles.lightBadgeRow]}>
            <Text style={[styles.sortBadgeText, isDark ? styles.mutedDark : styles.mutedLight]}>
              {sortBy === 'top'
                ? "Top is selected, so you'll see featured comments"
                : 'Newest comments listed first'}
            </Text>
          </View>

          {/* Comments List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color="#0095f6" />
              <Text style={[styles.loadingText, isDark ? styles.mutedDark : styles.mutedLight]}>
                Loading comments...
              </Text>
            </View>
          ) : sortedComments.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, isDark ? styles.mutedDark : styles.mutedLight]}>
                No comments yet. Be the first to start the conversation!
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedComments}
              keyExtractor={(item, index) => item._id || item.id || index.toString()}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) => {
                const commentUser = item.userId;
                const authorId = commentUser?._id || commentUser?.id || commentUser;
                const currentUserId = user?._id || user?.id;
                const isMyComment =
                  authorId && currentUserId && authorId.toString() === currentUserId.toString();
                const usernameTag =
                  commentUser?.username ||
                  (commentUser?.email ? commentUser.email.split('@')[0] : 'user');
                const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const likesCount = Math.floor((index * 7 + 3) % 25);
                const repliesCount = index % 2 === 0 ? (index % 3) + 1 : 0;
                const currentLikes =
                  commentLikesMap[item._id] !== undefined
                    ? commentLikesMap[item._id]
                    : likesCount;

                return (
                  <View style={styles.commentItem}>
                    {/* Avatar */}
                    <View style={[styles.commentAvatar, { backgroundColor: avatarBg }]}>
                      {commentUser?.avatarUrl ? (
                        <Image
                          source={{ uri: getMediaUrl(commentUser.avatarUrl) }}
                          style={styles.avatarImg}
                        />
                      ) : (
                        <Text style={styles.avatarLetter}>
                          {commentUser?.name ? commentUser.name[0].toUpperCase() : 'U'}
                        </Text>
                      )}
                    </View>

                    {/* Main Content */}
                    <View style={styles.commentContent}>
                      {/* Author Header */}
                      <View style={styles.commentAuthorRow}>
                        <Text
                          style={[styles.authorName, isDark ? styles.whiteText : styles.blackText]}
                        >
                          @{usernameTag}
                        </Text>
                        <Text
                          style={[
                            styles.commentTime,
                            isDark ? styles.mutedDark : styles.mutedLight,
                          ]}
                        >
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>

                        {isMyComment && (
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(item._id)}
                            style={styles.deleteBtn}
                          >
                            <Trash2 size={13} color="#f43f5e" />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Comment Body */}
                      <Text
                        style={[styles.commentText, isDark ? styles.whiteText : styles.blackText]}
                      >
                        {item.text}
                      </Text>

                      {/* Action Bar: Like, Dislike, Reply */}
                      <View style={styles.actionBar}>
                        <TouchableOpacity
                          style={styles.actionItem}
                          onPress={() => handleToggleLikeComment(item._id, likesCount)}
                        >
                          <ThumbsUp
                            size={14}
                            color={likedComments[item._id] ? '#0095f6' : isDark ? '#a1a1aa' : '#71717a'}
                            fill={likedComments[item._id] ? '#0095f6' : 'transparent'}
                          />
                          {currentLikes > 0 && (
                            <Text
                              style={[
                                styles.actionText,
                                likedComments[item._id] && styles.likedText,
                                isDark ? styles.mutedDark : styles.mutedLight,
                              ]}
                            >
                              {currentLikes}
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionItem}
                          onPress={() => handleToggleDislikeComment(item._id)}
                        >
                          <ThumbsDown
                            size={14}
                            color={dislikedComments[item._id] ? '#f43f5e' : isDark ? '#a1a1aa' : '#71717a'}
                            fill={dislikedComments[item._id] ? '#f43f5e' : 'transparent'}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.replyBtn}
                          onPress={() => handleReplyClick(usernameTag)}
                        >
                          <Text style={styles.replyBtnText}>Reply</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Replies Accordion */}
                      {repliesCount > 0 && (
                        <View style={styles.repliesContainer}>
                          <TouchableOpacity
                            style={styles.repliesToggle}
                            onPress={() => toggleReplies(item._id)}
                          >
                            {expandedReplies[item._id] ? (
                              <ChevronUp size={14} color="#0095f6" />
                            ) : (
                              <ChevronDown size={14} color="#0095f6" />
                            )}
                            <Text style={styles.repliesToggleText}>{repliesCount} replies</Text>
                          </TouchableOpacity>

                          {expandedReplies[item._id] && (
                            <View
                              style={[
                                styles.repliesList,
                                isDark ? styles.darkReplyBorder : styles.lightReplyBorder,
                              ]}
                            >
                              <View style={styles.replyItem}>
                                <View style={styles.replyAvatar}>
                                  <Text style={styles.replyAvatarLetter}>C</Text>
                                </View>
                                <Text
                                  style={[
                                    styles.replyAuthor,
                                    isDark ? styles.whiteText : styles.blackText,
                                  ]}
                                >
                                  @creator_pro
                                </Text>
                                <Text
                                  style={[
                                    styles.replyText,
                                    isDark ? styles.mutedDark : styles.mutedLight,
                                  ]}
                                >
                                  Thanks for watching! 🙏
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Sticky Input Bar */}
          <View style={[styles.inputRow, isDark ? styles.darkInputRow : styles.lightInputRow]}>
            <View style={styles.inputUserBadge}>
              <Text style={styles.inputUserBadgeLetter}>
                {user?.name ? user.name[0].toUpperCase() : 'G'}
              </Text>
            </View>
            <TextInput
              ref={inputRef}
              style={[styles.input, isDark ? styles.whiteText : styles.blackText]}
              placeholder={user ? 'Add a comment...' : 'Login to comment'}
              placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
              value={newComment}
              onChangeText={setNewComment}
              editable={!!user}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={submitting || !newComment.trim()}
              style={[styles.sendBtn, (!newComment.trim() || submitting) && styles.disabledSend]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send size={15} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalCard: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  darkCard: {
    backgroundColor: '#0f0f0f',
  },
  lightCard: {
    backgroundColor: '#ffffff',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  darkBorder: {
    borderBottomColor: '#272727',
  },
  lightBorder: {
    borderBottomColor: '#e4e4e7',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 16,
  },
  darkIconBtn: {
    backgroundColor: '#1f1f1f',
  },
  lightIconBtn: {
    backgroundColor: '#f4f4f5',
  },
  activeIconBtn: {
    backgroundColor: 'rgba(0, 149, 246, 0.15)',
  },
  sortBadgeRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  darkBadgeRow: {
    borderBottomColor: '#1f1f1f',
    backgroundColor: '#141414',
  },
  lightBadgeRow: {
    borderBottomColor: '#f4f4f5',
    backgroundColor: '#fafafa',
  },
  sortBadgeText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 12,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentTime: {
    fontSize: 10,
    marginLeft: 6,
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  commentText: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  actionText: {
    fontSize: 11,
  },
  likedText: {
    color: '#0095f6',
    fontWeight: 'bold',
  },
  replyBtn: {
    paddingVertical: 2,
  },
  replyBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0095f6',
  },
  repliesContainer: {
    marginTop: 6,
  },
  repliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repliesToggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0095f6',
  },
  repliesList: {
    borderLeftWidth: 2,
    paddingLeft: 10,
    marginTop: 6,
    gap: 6,
  },
  darkReplyBorder: {
    borderLeftColor: '#27272a',
  },
  lightReplyBorder: {
    borderLeftColor: '#e4e4e7',
  },
  replyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyAvatarLetter: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  replyText: {
    fontSize: 11,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  darkInputRow: {
    borderTopColor: '#272727',
    backgroundColor: '#141414',
  },
  lightInputRow: {
    borderTopColor: '#e4e4e7',
    backgroundColor: '#fafafa',
  },
  inputUserBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputUserBadgeLetter: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    height: 38,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
    paddingHorizontal: 6,
    fontSize: 12,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSend: {
    opacity: 0.4,
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
