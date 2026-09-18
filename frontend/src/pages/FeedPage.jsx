import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFeed,
  setSelectedCategory,
  resetSeenReelsThunk,
  flushViewBuffer,
  updatePostRealtime
} from "../store/feedSlice";
import { PostCard } from "../components/PostCard";
import { CreatePostModal } from "../components/CreatePostModal";
import { socket } from "../services/socket";
import { PlusCircle, Filter, CheckCircle2, RefreshCcw, Loader2 } from "lucide-react";

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
  const observerRef = useRef(null);

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
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Top Banner & Actions Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-[var(--text-primary)]">
            Reels Feed
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Watch content from top creators in real-time.
          </p>
        </div>

        {user && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 ig-btn-primary text-xs rounded-xl font-bold shadow-md transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Create</span>
          </button>
        )}
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => dispatch(setSelectedCategory(cat))}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm"
                : "ig-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed List */}
      {loading && posts.length === 0 ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="ig-card rounded-2xl h-80 animate-pulse bg-slate-500/5" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
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
        <div className="ig-card rounded-3xl p-10 text-center max-w-lg mx-auto my-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-500/10 text-[var(--text-muted)] border border-[var(--border-main)] flex items-center justify-center mx-auto mb-4">
            <Filter className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">No Posts Found</h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
            There are no reels available in this category yet.
          </p>
          {user && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 ig-btn-primary text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Be the first to post in {selectedCategory}
            </button>
          )}
        </div>
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
    </div>
  );
};
