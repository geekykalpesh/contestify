import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { likePostThunk, commentPostThunk, deleteCommentThunk, optimisticLike, bufferPostView, flushViewBuffer, setGlobalMuted } from "../store/feedSlice";
import { userApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { getMediaUrl, getMediaThumbnailUrl } from "../config";

import { Heart, MessageSquare, Eye, Share2, Play, Pause, Volume2, VolumeX, Music, MoreVertical } from "lucide-react";

// Format numbers like YouTube Shorts / Instagram (e.g. 1.6K, 21K, 499K)
const formatCount = (num) => {
  if (!num || isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
};

// Floating heart that animates from tap position — TikTok/Instagram double-tap style
const FloatingHeart = ({ x, y, id, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{ left: x - 36, top: y - 36 }}
    >
      <Heart
        className="w-[72px] h-[72px] fill-rose-500 text-rose-500 drop-shadow-2xl"
        style={{ animation: "floatHeart 0.9s cubic-bezier(0.22,0.61,0.36,1) forwards" }}
      />
    </div>
  );
};

export const PostCard = ({ post, inModal = false, onClose, onActive, onToggleComments, isCommentsOpen }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === "dark";
  const { globalAudioMuted } = useSelector((state) => state.feed);
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followAnimating, setFollowAnimating] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]); // for double-tap
  const lastTapRef = useRef(0);

  const videoRef = useRef(null);
  const cardRef = useRef(null);

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
            // Notify parent FeedPage that this post is active in view
            if (onActive) {
              onActive(post);
            }

            // Buffer view for batch logging so viewed reels advance in feed stream
            dispatch(bufferPostView(post._id));
            setTimeout(() => {
              dispatch(flushViewBuffer());
            }, 50);

            // Auto-play video if visible
            if (videoRef.current) {
              videoRef.current.muted = globalAudioMuted;
              videoRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            }
          } else {
            // Auto-pause video if out of viewport
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [post, dispatch, user, globalAudioMuted, onActive]);

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

  // Double-tap to like (TikTok / Instagram style)
  const handleVideoTap = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected!
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const heartId = now;
      setFloatingHearts(prev => [...prev, { id: heartId, x, y }]);
      // Trigger like if not already liked
      if (!post.hasLiked) {
        setLikeAnimating(true);
        setTimeout(() => setLikeAnimating(false), 400);
        dispatch(optimisticLike(post._id));
        dispatch(likePostThunk(post._id));
      }
    } else {
      togglePlay();
    }
    lastTapRef.current = now;
  };

  const removeFloatingHeart = (id) =>
    setFloatingHearts(prev => prev.filter(h => h.id !== id));

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
      toast.warning("Please login to like posts!", "Login Required");
      return;
    }

    // Spring bounce animation — the heart IS the feedback, no toast needed
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);

    try {
      dispatch(optimisticLike(post._id));
      await dispatch(likePostThunk(post._id)).unwrap();
      // No toast — the heart color + bounce = feedback (Instagram-style)
    } catch (err) {
      dispatch(optimisticLike(post._id)); // Revert optimistic toggle on failure
      toast.error("Could not update like. Try again.", "Error");
    }
  };

  const handleShare = () => {
    const postUrl = window.location.origin + `/profile/${usernameSlug}`;
    navigator.clipboard.writeText(postUrl);
    toast.success("Reel link copied to clipboard!", "Share Link Copied");
  };

  const postOwnerId = post.userId?._id || post.userId?.id || post.userId;
  const usernameSlug = post.userId?.username || postOwnerId;
  const currentUserId = user?._id || user?.id;
  const isOwnPost = postOwnerId && currentUserId && postOwnerId.toString() === currentUserId.toString();
  const avatarUrlToUse = post.userId?.avatarUrl || (isOwnPost ? user?.avatarUrl : null);

  const mediaSource = getMediaUrl(post.mediaUrl);
  const posterSource = getMediaThumbnailUrl(post.mediaUrl, post.thumbnailUrl);
  const isVideoPost =
    post.mediaType === "video" ||
    post.isVideo ||
    Boolean(post.mediaUrl && post.mediaUrl.match(/\.(mp4|mov|webm|mkv|avi|m3u8)($|\?)/i)) ||
    Boolean(post.mediaUrl && post.mediaUrl.includes("/video/upload/")) ||
    Boolean(post.mediaUrl && post.mediaUrl.includes("/creator-contest-reels/"));

  const handleFollow = () => {
    setFollowAnimating(true);
    setTimeout(() => setFollowAnimating(false), 350);
    setIsFollowing(f => !f);
  };

  return (
    <div
      ref={cardRef}
      className="flex items-center justify-center gap-3 sm:gap-5 my-3 sm:my-6 relative max-w-full"
      style={{ animation: "fadeInUp 0.45s cubic-bezier(0.22,0.61,0.36,1) both" }}
    >
      {/* 1. CENTRAL REEL CARD CONTAINER (Reduced width & increased height) */}
      <div className="w-full sm:w-[320px] md:w-[340px] aspect-[9/16] h-[84vh] max-h-[780px] rounded-2xl sm:rounded-3xl bg-black relative overflow-hidden shadow-2xl border border-[#272727] shrink-0 group">
        {/* TOP HOVER / TOUCH CONTROLS OVERLAY */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 flex items-center justify-between bg-gradient-to-b from-black/85 via-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 text-white pointer-events-auto">
          {/* Left Controls: Play/Pause & Mute/Unmute */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
              title={globalAudioMuted ? "Unmute" : "Mute"}
            >
              {globalAudioMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
          </div>

          {/* Right Controls: Subtitles (CC), Category Pill, Options */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#272727] text-white border border-white/10">
              {post.category}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toast.info("Subtitles enabled for video", "CC Enabled"); }}
              className="p-0.5 rounded-md hover:bg-white/20 transition-colors text-white font-extrabold text-[11px] border border-white/40 px-1.5 cursor-pointer"
              title="Closed Captions (CC)"
            >
              CC
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
              title="More Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video / Image Display */}
        {isVideoPost ? (
          <div className="relative w-full h-full cursor-pointer" onClick={handleVideoTap}>
            <video
              ref={videoRef}
              src={mediaSource}
              poster={posterSource}
              preload="metadata"
              loop
              muted={globalAudioMuted}
              playsInline
              className="w-full h-full object-cover"
            />
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-black/70 text-white flex items-center justify-center shadow-2xl backdrop-blur-md group-hover:scale-110 transition-transform border border-white/20">
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                </div>
              </div>
            )}
            {/* Floating hearts (double-tap) */}
            {floatingHearts.map(h => (
              <FloatingHeart key={h.id} x={h.x} y={h.y} id={h.id} onDone={() => removeFloatingHeart(h.id)} />
            ))}
          </div>
        ) : (
          <img src={mediaSource} alt={post.caption} loading="lazy" className="w-full h-full object-cover" />
        )}

        {/* Bottom Creator Info & Caption Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pr-14 md:pr-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-auto flex flex-col justify-end text-white">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Link to={usernameSlug ? `/profile/${usernameSlug}` : "#"} className="flex items-center gap-2 min-w-0 group/author">
              <div className="w-8 h-8 rounded-full ig-ring p-0.5 overflow-hidden shrink-0 shadow-md">
                {avatarUrlToUse ? (
                  <img src={getMediaUrl(avatarUrlToUse)} alt={post.userId?.name || "Creator"} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
                    {post.userId?.name ? post.userId.name[0].toUpperCase() : "C"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-white group-hover/author:text-sky-400 transition-colors truncate drop-shadow-md">
                  @{usernameSlug}
                </h3>
              </div>
            </Link>

            {/* Follow / Following Button */}
            {!isOwnPost && (
              <button
                type="button"
                onClick={handleFollow}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                  isFollowing
                    ? "bg-[#272727]/80 text-white hover:bg-[#3f3f3f] border border-white/20"
                    : "bg-white text-black hover:bg-slate-200"
                }`}
                style={{ animation: followAnimating ? "heartBounce 0.35s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          <p className="text-xs text-slate-100 line-clamp-2 leading-relaxed mb-2 font-medium drop-shadow-sm">
            {post.caption}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
            <Music className="w-3.5 h-3.5 text-sky-400 animate-spin-slow shrink-0" />
            <span className="truncate">Original audio - {post.userId?.name || usernameSlug}</span>
          </div>
        </div>

        {/* MOBILE FLOATING ACTION BAR (Small screens < md) */}
        <div className="md:hidden absolute bottom-4 right-2 z-30 flex flex-col items-center gap-2.5 text-white">
          {/* Audio / Mute Toggle Button (Mobile) */}
          {post.mediaType === "video" && (
            <button
              type="button"
              onClick={toggleMute}
              className="flex flex-col items-center gap-0.5 group cursor-pointer"
              title={globalAudioMuted ? "Unmute Audio" : "Mute Audio"}
            >
              <div className="w-9 h-9 rounded-full bg-[#181818]/90 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg text-white transition-transform active:scale-90 hover:bg-[#3f3f3f]">
                {globalAudioMuted ? (
                  <VolumeX className="w-4.5 h-4.5 text-white" />
                ) : (
                  <Volume2 className="w-4.5 h-4.5 text-white" />
                )}
              </div>
              <span className="text-[10px] font-bold drop-shadow-md text-white">
                {globalAudioMuted ? "Muted" : "Sound"}
              </span>
            </button>
          )}

          {/* Like */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-0.5 group cursor-pointer"
          >
            <div className={`w-9 h-9 rounded-full bg-[#181818]/90 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
              post.hasLiked ? "text-rose-500 fill-rose-500" : "text-white hover:bg-[#3f3f3f]"
            }`}>
              <Heart
                className={`w-4.5 h-4.5 transition-colors duration-150 ${post.hasLiked ? "fill-rose-500 text-rose-500" : ""}`}
                style={{ animation: likeAnimating ? "heartBounce 0.4s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}
              />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">{formatCount(post.likeCount)}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => onToggleComments && onToggleComments(post._id)}
            className="flex flex-col items-center gap-0.5 group cursor-pointer"
          >
            <div className={`w-9 h-9 rounded-full bg-[#181818]/90 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg text-white transition-transform active:scale-90 hover:bg-[#3f3f3f] ${
              isCommentsOpen ? "text-sky-400 border-sky-500/40" : ""
            }`}>
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">{formatCount(post.commentCount)}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-0.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#181818]/90 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg text-white transition-transform active:scale-90 hover:bg-[#3f3f3f]">
              <Share2 className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">Share</span>
          </button>

          {/* Views */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-9 h-9 rounded-full bg-[#181818]/90 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg text-white">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">{formatCount(post.viewCount)}</span>
          </div>
        </div>
      </div>

      {/* 2. DESKTOP VERTICAL ACTION BAR (Theme Aware & Compact) */}
      <div className="hidden md:flex flex-col items-center gap-3.5 shrink-0 self-end pb-4">
        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleLike}
            className={`w-11 h-11 rounded-full border shadow-lg flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
              isDark
                ? "bg-[#272727] hover:bg-[#3f3f3f] border-white/10 text-white"
                : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
            } ${post.hasLiked ? "!text-rose-500" : ""}`}
            title="Like Reel"
          >
            <Heart
              className={`w-5.5 h-5.5 transition-colors duration-150 ${post.hasLiked ? "fill-rose-500 text-rose-500" : ""}`}
              style={{ animation: likeAnimating ? "heartBounce 0.4s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}
            />
          </button>
          <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{formatCount(post.likeCount)}</span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onToggleComments && onToggleComments(post._id)}
            className={`w-11 h-11 rounded-full border shadow-lg flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
              isDark
                ? "bg-[#272727] hover:bg-[#3f3f3f] border-white/10 text-white"
                : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
            } ${isCommentsOpen ? "!border-sky-500 !text-sky-500 dark:!text-sky-400" : ""}`}
            title="Toggle Comments"
          >
            <MessageSquare className="w-5.5 h-5.5" />
          </button>
          <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{formatCount(post.commentCount)}</span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleShare}
            className={`w-11 h-11 rounded-full border shadow-lg flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
              isDark
                ? "bg-[#272727] hover:bg-[#3f3f3f] border-white/10 text-white"
                : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
            }`}
            title="Share Reel Link"
          >
            <Share2 className="w-5.5 h-5.5" />
          </button>
          <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Share</span>
        </div>

        {/* Views Count */}
        <div className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full border shadow-lg flex items-center justify-center ${
            isDark
              ? "bg-[#272727] border-white/10 text-white"
              : "bg-slate-100 border-slate-200 text-slate-800"
          }`}>
            <Eye className="w-5.5 h-5.5" />
          </div>
          <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{formatCount(post.viewCount)}</span>
        </div>
      </div>
    </div>
  );
};
