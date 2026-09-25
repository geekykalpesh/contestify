import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../services/api";
import { getMediaUrl } from "../config";
import { Search, X, Users, Film, Hash, Loader2, Sparkles, MapPin, Eye, Play } from "lucide-react";
import { useDispatch } from "react-redux";
import { setSelectedCategory } from "../store/feedSlice";
import { PostCard } from "./PostCard";

export const GlobalSearchInput = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'accounts' | 'reels' | 'categories'
  const [results, setResults] = useState({ users: [], posts: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const containerRef = useRef(null);

  // Debounced Search API fetch
  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [], categories: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await userApi.get(`/posts/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data?.success) {
          setResults(res.data.data || { users: [], posts: [], categories: [] });
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Outside click listener to dismiss search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCategory = (cat) => {
    dispatch(setSelectedCategory(cat));
    setIsOpen(false);
    setQuery("");
  };

  const hasResults =
    (results.users && results.users.length > 0) ||
    (results.posts && results.posts.length > 0) ||
    (results.categories && results.categories.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search creators, reels, #categories..."
          className="w-full pl-9 pr-8 py-1.5 bg-slate-500/10 border border-[var(--border-main)] rounded-full text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500 focus:bg-[var(--bg-main)] transition-all"
        />
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 absolute right-3 text-sky-500 animate-spin" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults({ users: [], posts: [], categories: [] });
            }}
            className="absolute right-2.5 p-0.5 rounded-full hover:bg-slate-500/20 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Instagram-Style Search Popover Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn max-h-[80vh] flex flex-col">
          {/* Tab Filter Bar */}
          <div className="flex items-center gap-1 p-2 border-b border-[var(--border-main)] bg-slate-500/5 text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === "all"
                  ? "bg-[var(--text-primary)] text-[var(--bg-main)] font-bold shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("accounts")}
              className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                activeTab === "accounts"
                  ? "bg-[var(--text-primary)] text-[var(--bg-main)] font-bold shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Creators ({results.users?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab("reels")}
              className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                activeTab === "reels"
                  ? "bg-[var(--text-primary)] text-[var(--bg-main)] font-bold shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Reels ({results.posts?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                activeTab === "categories"
                  ? "bg-[var(--text-primary)] text-[var(--bg-main)] font-bold shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Hash className="w-3 h-3" />
              <span>Categories ({results.categories?.length || 0})</span>
            </button>
          </div>

          {/* Results Scroll Body */}
          <div className="p-3 overflow-y-auto space-y-4 max-h-[60vh] text-xs">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-[var(--text-secondary)]">
                <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                <span>Searching creators & reels...</span>
              </div>
            ) : !hasResults ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">No results found for "{query}"</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Try searching by creator name, caption or category.</p>
              </div>
            ) : (
              <>
                {/* Categories Section */}
                {(activeTab === "all" || activeTab === "categories") && results.categories?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-sky-400" />
                      <span>Category Tags</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {results.categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => handleSelectCategory(cat)}
                          className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold text-xs hover:bg-sky-500/20 transition-colors"
                        >
                          #{cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accounts / Creators Section */}
                {(activeTab === "all" || activeTab === "accounts") && results.users?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>Creators & Accounts</span>
                    </h4>
                    <div className="space-y-1.5">
                      {results.users.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => {
                            const userSlug = user.username || (user.email ? user.email.split("@")[0] : null) || user._id;
                            navigate(`/profile/${userSlug}`);
                            setIsOpen(false);
                            setQuery("");
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-500/10 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full ig-ring p-0.5 overflow-hidden shrink-0">
                              {user.avatarUrl ? (
                                <img
                                  src={getMediaUrl(user.avatarUrl)}
                                  alt={user.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center font-bold text-[var(--text-primary)] text-xs">
                                  {user.name ? user.name[0].toUpperCase() : "U"}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[var(--text-primary)] text-xs truncate">{user.name}</p>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
                            </div>
                          </div>

                          {user.residency === "Chhattisgarh" && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>CG</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Reels Section */}
                {(activeTab === "all" || activeTab === "reels") && results.posts?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1">
                      <Film className="w-3 h-3 text-purple-400" />
                      <span>Video Reels & Posts</span>
                    </h4>
                    <div className="space-y-2">
                      {results.posts.map((post) => {
                        const coverUrl = post.thumbnailUrl
                          ? getMediaUrl(post.thumbnailUrl)
                          : post.mediaType === "image"
                          ? getMediaUrl(post.mediaUrl)
                          : null;

                        return (
                          <div
                            key={post._id}
                            onClick={() => {
                              setSelectedPost(post);
                              setIsOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-500/10 transition-colors cursor-pointer group border border-[var(--border-main)]/50"
                          >
                            <div className="w-14 h-12 rounded-lg bg-black overflow-hidden shrink-0 relative border border-[var(--border-main)]">
                              {coverUrl ? (
                                <img src={coverUrl} alt={post.caption} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                  <Film className="w-5 h-5" />
                                </div>
                              )}
                              {post.mediaType === "video" && (
                                <span className="absolute bottom-1 right-1 p-0.5 rounded-full bg-black/70 text-white">
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[var(--text-primary)] text-xs line-clamp-1 group-hover:text-sky-400 transition-colors">
                                {post.caption}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-muted)]">
                                <span>by {post.userId?.name || "Creator"}</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-500/15 text-[var(--text-secondary)] font-bold">
                                  {post.category}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Eye className="w-3 h-3 text-emerald-400" />
                                  {post.viewCount || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Selected Post Modal Preview */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg relative">
            <PostCard post={selectedPost} inModal={true} onClose={() => setSelectedPost(null)} />
          </div>
        </div>
      )}
    </div>
  );
};
