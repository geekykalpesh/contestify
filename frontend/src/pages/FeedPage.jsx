import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFeed,
  setSelectedCategory,
  flushViewBuffer,
  updatePostRealtime
} from "../store/feedSlice";
import { PostCard } from "../components/PostCard";
import { CommentsPanel } from "../components/CommentsPanel";
import { CreatePostModal } from "../components/CreatePostModal";
import { socket } from "../services/socket";
import { PlusCircle, Filter, CheckCircle2, Loader2, ChevronUp, ChevronDown } from "lucide-react";

const CATEGORIES = [
  "ALL",
  "Tech",
  "Art",
  "Music",
  "Gaming",
  "Fitness",
  "Food",
  "Travel",
  "Fashion",
  "Education",
  "Entertainment"
];

export const FeedPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { posts, selectedCategory, meta, pagination, loading, loadingMore } = useSelector((state) => state.feed);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(true); // Open by default like YouTube Shorts!

  const observerRef = useRef(null);

  // Set initial activePost when posts load
  useEffect(() => {
    if (posts.length > 0 && !activePost) {
      setActivePost(posts[0]);
    }
  }, [posts, activePost]);

  // Handle active post detection instantly on scroll
  const handleActivePost = useCallback((post) => {
    if (post && post._id !== activePost?._id) {
      setActivePost(post);
    }
  }, [activePost?._id]);

  const handleToggleComments = useCallback((postId) => {
    setIsCommentsOpen((prev) => !prev);
  }, []);

  // Fetch feed on category changes
  useEffect(() => {
    dispatch(
      fetchFeed({
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        page: 1
      })
    );
  }, [dispatch, selectedCategory]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const handleObserver = (entries) => {
      const target = entries[0];
      if (target.isIntersecting && pagination.hasMore && !loading && !loadingMore) {
        dispatch(
          fetchFeed({
            category: selectedCategory === "ALL" ? undefined : selectedCategory,
            page: pagination.page + 1,
            append: true
          })
        );
      }
    };

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "200px",
      threshold: 0.1
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [dispatch, selectedCategory, pagination, loading, loadingMore]);

  // Real-time socket events listener
  useEffect(() => {
    const handlePostUpdated = (data) => {
      dispatch(updatePostRealtime(data));
    };

    socket.on("post_updated", handlePostUpdated);

    return () => {
      socket.off("post_updated", handlePostUpdated);
    };
  }, [dispatch]);

  // Frequently flush view buffer (every 1.5s) & flush instantly on page refresh/unload
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(flushViewBuffer());
    }, 1500);

    const handleBeforeUnload = () => {
      dispatch(flushViewBuffer());
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      dispatch(flushViewBuffer());
    };
  }, [dispatch]);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-2 sm:py-6 relative">
      {/* Top Banner & Actions Bar (Clean YouTube Shorts Style) */}
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Reels Feed
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 sm:mt-1 font-medium">
            Watch content from top creators in real-time.
          </p>
        </div>

        {user && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-xs rounded-full font-bold shadow-md transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Create</span>
          </button>
        )}
      </div>

      {/* Category Pills Slider (Supports Light & Dark Theme Modes) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 sm:mb-6 no-scrollbar">
        <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => dispatch(setSelectedCategory(cat))}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-slate-900 text-white dark:bg-white dark:text-black font-bold shadow-sm"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 dark:bg-[#272727] dark:text-white dark:hover:bg-[#3f3f3f] dark:border-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* CENTERED REELS FEED (Video section stays perfectly centered) */}
      <div className="w-full max-w-[400px] mx-auto flex flex-col items-center">
        {loading && posts.length === 0 ? (
          <div className="w-full space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="w-full aspect-[9/16] rounded-3xl animate-pulse bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#272727]" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="w-full space-y-8">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onActive={handleActivePost}
                onToggleComments={handleToggleComments}
                isCommentsOpen={isCommentsOpen}
              />
            ))}

            {/* Infinite Scroll Trigger Sentinel */}
            <div ref={observerRef} className="py-4 text-center">
              {loadingMore && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-[var(--text-secondary)]">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Loading more reels...</span>
                </div>
              )}
              {meta.isFallback && (
                <div className="py-3 text-center">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>You've seen all new reels! Suggesting top-rated reels</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty Category State */
          <div className="w-full rounded-3xl p-10 text-center bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-[#272727] my-8 shadow-sm text-slate-900 dark:text-white">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-[#272727] text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold mb-1">No Posts Found</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              There are no reels available in this category yet.
            </p>
            {user && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-black font-bold text-xs rounded-full shadow-md cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-200"
              >
                Be the first to post in {selectedCategory}
              </button>
            )}
          </div>
        )}
      </div>

      {/* FIXED RIGHT SIDE COMMENTS PANEL (Overlayed on right edge so video position is 100% steady) */}
      {isCommentsOpen && activePost && (
        <CommentsPanel
          activePost={activePost}
          onClose={() => setIsCommentsOpen(false)}
        />
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={() =>
          dispatch(
            fetchFeed({
              category: selectedCategory === "ALL" ? undefined : selectedCategory,
              page: 1
            })
          )
        }
      />

      {/* Desktop Up / Down Reels Scroll Navigation Arrows (Positioned on the RIGHT SIDE ONLY) */}
      <div
        className={`hidden xl:flex flex-col items-center gap-3 fixed top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${
          isCommentsOpen ? "right-[350px] xl:right-[410px]" : "right-6 xl:right-12"
        }`}
      >
        <button
          onClick={() => window.scrollBy({ top: -760, behavior: "smooth" })}
          className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#272727] dark:hover:bg-[#3f3f3f] text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 shadow-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Previous Reel"
        >
          <ChevronUp className="w-5.5 h-5.5" />
        </button>
        <button
          onClick={() => window.scrollBy({ top: 760, behavior: "smooth" })}
          className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#272727] dark:hover:bg-[#3f3f3f] text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 shadow-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Next Reel"
        >
          <ChevronDown className="w-5.5 h-5.5" />
        </button>
      </div>
    </div>
  );
};
