import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { commentPostThunk, deleteCommentThunk } from "../store/feedSlice";
import { userApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { MessageSquare, X, Send, Trash2, SlidersHorizontal, ThumbsUp, ThumbsDown, MoreVertical, ChevronDown, ChevronUp } from "lucide-react";

const AVATAR_COLORS = [
  "bg-amber-600",
  "bg-emerald-600",
  "bg-sky-600",
  "bg-indigo-600",
  "bg-purple-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-orange-600"
];

export const CommentsPanel = ({ activePost, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === "dark";
  const { toast } = useToast();

  const [commentsList, setCommentsList] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});

  // Interactive comments state
  const [likedComments, setLikedComments] = useState({});
  const [dislikedComments, setDislikedComments] = useState({});
  const [commentLikesMap, setCommentLikesMap] = useState({});
  const [sortBy, setSortBy] = useState("top"); // "top" | "newest"

  const inputRef = useRef(null);

  // In-memory cache for instant comment switching on scroll
  const commentsCacheRef = useRef({});

  // INSTANT UPDATE ON SCROLL: Load from cache immediately, then sync with API
  useEffect(() => {
    if (!activePost?._id) return;

    const postId = activePost._id;

    // 1. INSTANT DISPLAY: If comments are cached, update state immediately with 0ms lag!
    if (commentsCacheRef.current[postId]) {
      setCommentsList(commentsCacheRef.current[postId]);
      setLoading(false);
    } else if (Array.isArray(activePost.comments) && activePost.comments.length > 0) {
      setCommentsList(activePost.comments);
      commentsCacheRef.current[postId] = activePost.comments;
      setLoading(false);
    } else {
      setCommentsList([]);
      setLoading(true);
    }

    // 2. Background API Sync
    let isMounted = true;
    userApi
      .get(`/posts/${postId}/comments`)
      .then((res) => {
        if (isMounted) {
          const freshComments = res.data.data || [];
          setCommentsList(freshComments);
          commentsCacheRef.current[postId] = freshComments;
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load comments", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activePost?._id]);

  const handleToggleLikeComment = (commentId, initialLikes) => {
    setLikedComments((prev) => {
      const isCurrentlyLiked = !!prev[commentId];
      const newLikedState = !isCurrentlyLiked;

      // If liking, remove dislike
      if (newLikedState) {
        setDislikedComments((dPrev) => ({ ...dPrev, [commentId]: false }));
      }

      setCommentLikesMap((lPrev) => {
        const currentCount = lPrev[commentId] !== undefined ? lPrev[commentId] : initialLikes;
        return {
          ...lPrev,
          [commentId]: newLikedState ? currentCount + 1 : Math.max(0, currentCount - 1)
        };
      });

      return { ...prev, [commentId]: newLikedState };
    });
  };

  const handleToggleDislikeComment = (commentId) => {
    setDislikedComments((prev) => {
      const isCurrentlyDisliked = !!prev[commentId];
      const newDislikedState = !isCurrentlyDisliked;

      // If disliking, remove like if active
      if (newDislikedState && likedComments[commentId]) {
        setLikedComments((lPrev) => ({ ...lPrev, [commentId]: false }));
        setCommentLikesMap((lPrev) => ({
          ...lPrev,
          [commentId]: Math.max(0, (lPrev[commentId] || 1) - 1)
        }));
      }

      return { ...prev, [commentId]: newDislikedState };
    });
  };

  const handleReplyClick = (usernameTag) => {
    setCommentText(`@${usernameTag} `);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleToggleSort = () => {
    const nextSort = sortBy === "top" ? "newest" : "top";
    setSortBy(nextSort);
    toast.info(nextSort === "top" ? "Sorting by Top Comments" : "Sorting by Newest Comments", "Comments Sorted");
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      toast.warning("Please login to comment!", "Authentication Required");
      return;
    }
    const postOwnerId = activePost.userId?._id || activePost.userId?.id || activePost.userId;
    const currentUserId = user._id || user.id;
    if (postOwnerId && currentUserId && postOwnerId.toString() === currentUserId.toString()) {
      toast.error("You cannot comment on your own post!", "Action Restricted");
      return;
    }

    const textToSend = commentText;
    setCommentText("");

    try {
      const result = await dispatch(commentPostThunk({ postId: activePost._id, text: textToSend })).unwrap();
      const newComment = result.comment;
      setCommentsList((prev) => {
        const updated = [newComment, ...prev];
        if (activePost._id) {
          commentsCacheRef.current[activePost._id] = updated;
        }
        return updated;
      });
      toast.success("Comment added successfully!", "Comment Posted");
    } catch (err) {
      toast.error(err || "Failed to post comment", "Error");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await dispatch(deleteCommentThunk({ postId: activePost._id, commentId })).unwrap();
      setCommentsList((prev) => {
        const updated = prev.filter((c) => c._id !== commentId);
        if (activePost._id) {
          commentsCacheRef.current[activePost._id] = updated;
        }
        return updated;
      });
      toast.success("Comment deleted!", "Comment Removed");
    } catch (err) {
      toast.error(err || "Failed to delete comment", "Error");
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  if (!activePost) return null;

  // Process sorted list based on sortBy selection
  const sortedComments = [...commentsList].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return (b.text?.length || 0) - (a.text?.length || 0);
  });

  return (
    <>
      {/* 1. DESKTOP FIXED RIGHT SIDE PANEL (Theme Aware & Fully Interactive) */}
      <div
        className={`hidden lg:flex flex-col w-[320px] xl:w-[350px] h-[84vh] max-h-[780px] fixed right-4 xl:right-12 top-16 shadow-2xl rounded-2xl border overflow-hidden z-40 animate-slideLeft transition-colors duration-200 ${
          isDark ? "bg-[#0f0f0f] border-[#272727] text-white" : "bg-white border-slate-200 text-slate-900 shadow-slate-300/50"
        }`}
      >
        {/* Panel Header */}
        <div
          className={`p-3.5 border-b flex items-center justify-between shrink-0 transition-colors ${
            isDark ? "bg-[#0f0f0f] border-[#272727]" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className={isDark ? "text-white" : "text-slate-900"}>Comments</span>
            <span className={`text-xs font-normal ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {commentsList.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSort}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark ? "text-slate-300 hover:bg-[#272727] hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } ${sortBy === "newest" ? "text-sky-500" : ""}`}
              title={sortBy === "top" ? "Sorted by Top. Click for Newest" : "Sorted by Newest. Click for Top"}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isDark ? "text-slate-300 hover:bg-[#272727] hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                title="Close comments"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Comments List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 no-scrollbar">
          {loading && commentsList.length === 0 ? (
            <div className={`text-center text-xs py-12 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Loading comments...
            </div>
          ) : sortedComments.length === 0 ? (
            <div className={`text-center text-xs py-16 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              No comments yet. Be the first to start a conversation!
            </div>
          ) : (
            sortedComments.map((c, idx) => {
              const authorId = c.userId?._id || c.userId?.id || c.userId;
              const currentUserId = user?._id || user?.id;
              const isMyComment = authorId && currentUserId && authorId.toString() === currentUserId.toString();
              const usernameTag = c.userId?.username || (c.userId?.email ? c.userId.email.split("@")[0] : "user");
              const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const likesCount = Math.floor((idx * 7 + 3) % 25);
              const repliesCount = idx % 2 === 0 ? (idx % 3) + 2 : 0;
              const currentLikes = commentLikesMap[c._id] !== undefined ? commentLikesMap[c._id] : likesCount;

              return (
                <div key={c._id} className="flex items-start gap-2.5 group text-xs">
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full ${avatarBg} text-white font-bold flex items-center justify-center text-[11px] shrink-0 overflow-hidden shadow-sm`}>
                    {c.userId?.avatarUrl ? (
                      <img src={c.userId.avatarUrl} alt={c.userId?.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{c.userId?.name ? c.userId.name[0].toUpperCase() : "U"}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                          @{usernameTag}
                        </span>
                        <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isMyComment && (
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className={`p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                              isDark ? "text-slate-500 hover:text-rose-400" : "text-slate-400 hover:text-rose-500"
                            }`}
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          className={`p-0.5 cursor-pointer ${
                            isDark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-800"
                          }`}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                      {c.text}
                    </p>

                    {/* Action Bar (ThumbsUp, ThumbsDown, Reply) */}
                    <div className={`flex items-center gap-3.5 pt-0.5 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <button
                        type="button"
                        onClick={() => handleToggleLikeComment(c._id, likesCount)}
                        className={`flex items-center gap-1 cursor-pointer transition-colors ${
                          likedComments[c._id]
                            ? "text-sky-500 font-bold"
                            : isDark ? "hover:text-white" : "hover:text-slate-900"
                        }`}
                        title="Like comment"
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${likedComments[c._id] ? "fill-sky-500" : ""}`} />
                        {currentLikes > 0 && <span>{currentLikes}</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDislikeComment(c._id)}
                        className={`flex items-center gap-1 cursor-pointer transition-colors ${
                          dislikedComments[c._id]
                            ? "text-rose-500 font-bold"
                            : isDark ? "hover:text-white" : "hover:text-slate-900"
                        }`}
                        title="Dislike comment"
                      >
                        <ThumbsDown className={`w-3.5 h-3.5 ${dislikedComments[c._id] ? "fill-rose-500" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReplyClick(usernameTag)}
                        className={`font-semibold cursor-pointer ${
                          isDark ? "hover:text-white" : "hover:text-slate-900"
                        }`}
                      >
                        Reply
                      </button>
                    </div>

                    {/* Replies Accordion Toggle */}
                    {repliesCount > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleReplies(c._id)}
                          className={`flex items-center gap-1 font-semibold text-[11px] cursor-pointer ${
                            isDark ? "text-sky-400 hover:text-sky-300" : "text-sky-600 hover:text-sky-700"
                          }`}
                        >
                          {expandedReplies[c._id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{repliesCount} replies</span>
                        </button>

                        {expandedReplies[c._id] && (
                          <div className={`pl-3 border-l-2 mt-2 space-y-2 text-[11px] ${
                            isDark ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-700"
                          }`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] ${
                                isDark ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-800"
                              }`}>R</div>
                              <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-900"}`}>@creator_pro</span>
                              <span className={isDark ? "text-slate-200" : "text-slate-700"}>Thanks for watching! 🙏</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info text (Exact YouTube Shorts Wording) */}
        <div
          className={`px-3 py-1.5 border-t text-[10px] text-center font-medium shrink-0 ${
            isDark ? "bg-[#0f0f0f] border-[#272727] text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"
          }`}
        >
          {sortBy === "top" ? "Top is selected, so you'll see featured comments" : "Newest comments listed first"}
        </div>

        {/* Sticky Input Bar */}
        <form
          onSubmit={handleAddComment}
          className={`p-3 border-t flex items-center gap-2 shrink-0 ${
            isDark ? "bg-[#141414] border-[#272727]" : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
            {user?.name ? user.name[0].toUpperCase() : "G"}
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className={`flex-1 bg-transparent border-b text-xs py-1 px-1 focus:outline-none transition-colors ${
              isDark
                ? "border-[#3f3f3f] focus:border-white text-white placeholder-slate-500"
                : "border-slate-300 focus:border-slate-900 text-slate-900 placeholder-slate-400"
            }`}
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className={`p-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              isDark
                ? "bg-white text-black hover:bg-slate-200 disabled:opacity-30"
                : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 2. MOBILE BOTTOM SHEET (< lg) */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 h-[75vh] border-t rounded-t-3xl flex flex-col shadow-2xl animate-slideUp overflow-hidden ${
          isDark ? "bg-[#0f0f0f] border-[#272727] text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className={`p-3 border-b flex items-center justify-between shrink-0 relative ${
          isDark ? "border-[#272727]" : "border-slate-200"
        }`}>
          <div className={`w-12 h-1 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2 ${
            isDark ? "bg-slate-700" : "bg-slate-300"
          }`} />
          <div className="flex items-center gap-2 font-bold text-sm pt-2">
            <MessageSquare className="w-4 h-4" />
            <span>Comments ({commentsList.length})</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer pt-2 ${
                isDark ? "text-slate-400 hover:text-white hover:bg-[#272727]" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {loading && commentsList.length === 0 ? (
            <div className={`text-center text-xs py-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Loading comments...
            </div>
          ) : sortedComments.length === 0 ? (
            <div className={`text-center text-xs py-10 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              No comments yet. Be the first to start a conversation!
            </div>
          ) : (
            sortedComments.map((c, idx) => {
              const authorId = c.userId?._id || c.userId?.id || c.userId;
              const currentUserId = user?._id || user?.id;
              const isMyComment = authorId && currentUserId && authorId.toString() === currentUserId.toString();
              const usernameTag = c.userId?.username || (c.userId?.email ? c.userId.email.split("@")[0] : "user");
              const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <div key={c._id} className="flex items-start gap-2.5 text-xs">
                  <div className={`w-7 h-7 rounded-full ${avatarBg} text-white font-bold flex items-center justify-center text-[10px] shrink-0`}>
                    {c.userId?.name ? c.userId.name[0].toUpperCase() : "U"}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                        @{usernameTag}
                      </span>
                      {isMyComment && (
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          className={isDark ? "text-slate-500 hover:text-rose-400 p-0.5" : "text-slate-400 hover:text-rose-500 p-0.5"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className={isDark ? "text-slate-100 text-xs" : "text-slate-800 text-xs"}>{c.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleAddComment}
          className={`p-3 border-t flex gap-2 shrink-0 ${
            isDark ? "bg-[#141414] border-[#272727]" : "bg-slate-50 border-slate-200"
          }`}
        >
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className={`flex-1 rounded-full px-4 py-2 text-xs focus:outline-none ${
              isDark
                ? "bg-[#272727] border border-[#3f3f3f] text-white placeholder-slate-400 focus:border-slate-300"
                : "bg-slate-100 border border-slate-300 text-slate-900 placeholder-slate-500 focus:border-slate-500"
            }`}
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className={`px-4 py-2 font-bold rounded-full text-xs shrink-0 cursor-pointer ${
              isDark ? "bg-white text-black disabled:opacity-30" : "bg-slate-900 text-white disabled:opacity-30"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </>
  );
};
