import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { likePostThunk, commentPostThunk, deleteCommentThunk, optimisticLike, bufferPostView, flushViewBuffer, setGlobalMuted } from "../store/feedSlice";
import { userApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { getMediaUrl } from "../config";

import { Heart, MessageSquare, Eye, Share2, Award, Play, Pause, Send, Volume2, VolumeX, X, Trash2 } from "lucide-react";

export const PostCard = ({ post, inModal = false, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { globalAudioMuted } = useSelector((state) => state.feed);
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const videoRef = useRef(null);
  const cardRef = useRef(null);

  const isCG = post.userId?.residency === "Chhattisgarh";

  // Sync video audio muted state with globalAudioMuted setting
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = globalAudioMuted;
    }
  }, [globalAudioMuted]);

  // IntersectionObserver for media lazy loading & view tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Buffer view for batch logging if NOT watching own post
            const postOwnerId = post.userId?._id || post.userId?.id || post.userId;
            const currentUserId = user?._id || user?.id;
            if (!postOwnerId || !currentUserId || postOwnerId.toString() !== currentUserId.toString()) {
              dispatch(bufferPostView(post._id));
              setTimeout(() => {
                dispatch(flushViewBuffer());
              }, 50);
            }

            // Auto-play video if visible (ensuring muted property matches global setting)
            if (videoRef.current) {
              videoRef.current.muted = globalAudioMuted;
              videoRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            }
          } else {
            // Auto-pause video if out of viewport to save RAM & CPU
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [post._id, dispatch, user, globalAudioMuted]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const nextMutedState = !globalAudioMuted;
    dispatch(setGlobalMuted(nextMutedState));
    if (videoRef.current) {
      videoRef.current.muted = nextMutedState;
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.warning("Please login to like posts!", "Authentication Required");
      return;
    }
    const postOwnerId = post.userId?._id || post.userId?.id || post.userId;
    const currentUserId = user._id || user.id;
    if (postOwnerId && currentUserId && postOwnerId.toString() === currentUserId.toString()) {
      toast.error("You cannot like your own post!", "Action Restricted");
      return;
    }

    try {
      dispatch(optimisticLike(post._id));
      const res = await dispatch(likePostThunk(post._id)).unwrap();
      if (res.hasLiked) {
        toast.success("Post liked!", "Liked");
      } else {
        toast.info("Like removed!", "Unliked");
      }
    } catch (err) {
      dispatch(optimisticLike(post._id)); // Revert optimistic toggle on failure
      toast.error(err || "Failed to toggle like", "Error");
    }
  };

  const toggleCommentsDrawer = async () => {
    setShowComments(!showComments);
    if (!showComments && commentsList.length === 0) {
      try {
        setLoadingComments(true);
        const res = await userApi.get(`/posts/${post._id}/comments`);
        setCommentsList(res.data.data);
      } catch (e) {
        console.error("Failed to load comments");
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      toast.warning("Please login to comment!", "Authentication Required");
      return;
    }
    const postOwnerId = post.userId?._id || post.userId?.id || post.userId;
    const currentUserId = user._id || user.id;
    if (postOwnerId && currentUserId && postOwnerId.toString() === currentUserId.toString()) {
      toast.error("You cannot comment on your own post!", "Action Restricted");
      return;
    }

    const textToSend = commentText;
    setCommentText("");

    try {
      const result = await dispatch(commentPostThunk({ postId: post._id, text: textToSend })).unwrap();
      setCommentsList((prev) => [result.comment, ...prev]);
      toast.success("Comment added successfully!", "Comment Posted");
    } catch (err) {
      toast.error(err || "Failed to post comment", "Error");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await dispatch(deleteCommentThunk({ postId: post._id, commentId })).unwrap();
      setCommentsList((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted!", "Comment Removed");
    } catch (err) {
      toast.error(err || "Failed to delete comment", "Error");
    }
  };

  const postOwnerId = post.userId?._id || post.userId?.id || post.userId;
  const currentUserId = user?._id || user?.id;
  const isOwnPost = postOwnerId && currentUserId && postOwnerId.toString() === currentUserId.toString();
  const avatarUrlToUse = post.userId?.avatarUrl || (isOwnPost ? user?.avatarUrl : null);

  const mediaSource = getMediaUrl(post.mediaUrl);

  return (
    <div
      ref={cardRef}
      className={`ig-card rounded-2xl overflow-hidden transition-colors duration-200 border border-[var(--border-main)] ${inModal ? "mb-0 shadow-2xl" : "mb-6 shadow-md"}`}
    >
      {/* Header Info */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2 border-b border-[var(--border-main)]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ig-ring p-0.5 shadow-sm overflow-hidden shrink-0">
            {avatarUrlToUse ? (
              <img
                src={getMediaUrl(avatarUrlToUse)}
                alt={post.userId?.name || "Creator"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center font-bold text-[var(--text-primary)] text-xs">
                {post.userId?.name ? post.userId.name[0].toUpperCase() : "C"}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[var(--text-primary)] text-xs sm:text-sm truncate leading-tight" title={post.userId?.name || "Creator"}>
              {post.userId?.name || "Creator"}
            </h3>
            <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] block truncate">
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        </div>

        {/* Category Pill, Score Badge & Optional Close Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
          <span className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--border-main)] whitespace-nowrap">
            {post.category}
          </span>
          {/* Internal Contest Score (Visible to Admin Only) */}
          {(user?.role === "admin" || user?.email === "admin@gmail.com" || user?.email === "admin@creator.com") && (
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 whitespace-nowrap">
              <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
              <span>Score: {post.score || 0}</span>
            </div>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-500/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-1 shrink-0 cursor-pointer"
              title="Close preview"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Media Player Container */}
      <div className="relative bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center overflow-hidden group">
        {post.mediaType === "video" ? (
          <div className="relative w-full h-full cursor-pointer" onClick={togglePlay}>
            <video
              ref={videoRef}
              src={mediaSource}
              loop
              muted={globalAudioMuted}
              playsInline
              className="w-full h-full object-contain"
            />
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/70 text-white flex items-center justify-center shadow-xl backdrop-blur-md group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-current translate-x-0.5" />
                </div>
              </div>
            )}

            {/* Audio Mute / Unmute Button */}
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 z-20 p-2 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md shadow-md border border-white/20 transition-all active:scale-95"
              title={globalAudioMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {globalAudioMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>
        ) : (
          <img
            src={mediaSource}
            alt={post.caption}
            loading="lazy"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Caption & Actions */}
      <div className="p-4 space-y-3">
        <p className="text-[var(--text-primary)] text-xs sm:text-sm leading-relaxed">{post.caption}</p>

        {/* Interactive Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-main)] text-[var(--text-secondary)] text-xs font-medium">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                post.hasLiked
                  ? "text-rose-500 bg-rose-500/10 font-bold"
                  : "hover:text-rose-500 hover:bg-slate-500/10"
              }`}
            >
              <Heart className={`w-4 h-4 ${post.hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
              <span>{post.likeCount || 0}</span>
            </button>

            <button
              onClick={toggleCommentsDrawer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-[var(--text-primary)] hover:bg-slate-500/10 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentCount || 0} Comments</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[var(--text-muted)]">
            <Eye className="w-4 h-4" />
            <span>{post.viewCount || 0} Views</span>
          </div>
        </div>

        {/* Comments Section Drawer */}
        {showComments && (
          <div className="pt-3 border-t border-[var(--border-main)] space-y-3 animate-fadeIn">
            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-3 py-2 ig-btn-primary disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Comments List */}
            {loadingComments ? (
              <div className="text-center text-xs text-[var(--text-muted)] py-2">Loading comments...</div>
            ) : commentsList.length === 0 ? (
              <div className="text-center text-xs text-[var(--text-muted)] py-2">No comments yet. Be the first!</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {commentsList.map((c) => {
                  const authorId = c.userId?._id || c.userId?.id || c.userId;
                  const currentUserId = user?._id || user?.id;
                  const isMyComment = authorId && currentUserId && authorId.toString() === currentUserId.toString();
                  return (
                    <div key={c._id} className="bg-slate-500/5 rounded-xl p-2.5 text-xs border border-[var(--border-main)] flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sky-500">{c.userId?.name || "User"}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[var(--text-primary)]">{c.text}</p>
                      </div>
                      {isMyComment && (
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          className="p-1 rounded hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
