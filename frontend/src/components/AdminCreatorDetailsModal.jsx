import React, { useState } from "react";
import { X, Heart, MessageCircle, Eye, Calendar, Award, User, CheckCircle2, XCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

export const AdminCreatorDetailsModal = ({ creator, onClose }) => {
  const [activeTab, setActiveTab] = useState("ALL_POSTS"); // "ALL_POSTS" | "WEEKLY_BREAKDOWN"
  const [expandedWeek, setExpandedWeek] = useState(1);

  if (!creator) return null;

  const posts = creator.allPosts || creator.userPosts || [];
  const week1 = creator.week1Posts || [];
  const week2 = creator.week2Posts || [];
  const week3 = creator.week3Posts || [];
  const week4 = creator.week4Posts || [];

  const totalLikes = creator.totalLikes || posts.reduce((sum, p) => sum + (p.likeCount || 0), 0);
  const totalComments = creator.totalComments || posts.reduce((sum, p) => sum + (p.commentCount || 0), 0);
  const totalViews = creator.totalViews || posts.reduce((sum, p) => sum + (p.viewCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="ig-card w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-main)] bg-[var(--bg-card)] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] flex items-center justify-between bg-slate-500/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 font-black flex items-center justify-center text-base border border-indigo-500/30">
              {creator.userName ? creator.userName[0].toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[var(--text-primary)] text-base">
                  {creator.userName}
                </h3>
                {creator.isChhattisgarh ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    CG Resident
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-[var(--text-muted)] border border-slate-500/20 text-[10px] font-semibold">
                    {creator.residency || "Non-CG"}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-mono">{creator.userEmail}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-500/20 text-[var(--text-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Performance Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-4 bg-slate-500/5 border-b border-[var(--border-main)] shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Total Posts</div>
            <div className="text-lg font-black text-sky-400 font-mono mt-0.5">{creator.totalPosts || posts.length}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Total Likes</div>
            <div className="text-lg font-black text-rose-500 font-mono mt-0.5">{totalLikes}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Total Comments</div>
            <div className="text-lg font-black text-sky-400 font-mono mt-0.5">{totalComments}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Total Views</div>
            <div className="text-lg font-black text-indigo-400 font-mono mt-0.5">{totalViews}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Max Single Score</div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">{creator.maxScore || creator.week1MaxScore || 0} pts</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Consistency Qualified</div>
            <div className="mt-1">
              {creator.isConsistencyEligible ? (
                <span className="text-[10px] font-bold text-emerald-400">Yes (3+/wk)</span>
              ) : (
                <span className="text-[10px] font-semibold text-rose-400">Ineligible</span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-3 px-6 pt-3 border-b border-[var(--border-main)] shrink-0">
          <button
            onClick={() => setActiveTab("ALL_POSTS")}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "ALL_POSTS"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            All Published Posts Minute Tracking ({posts.length})
          </button>

          <button
            onClick={() => setActiveTab("WEEKLY_BREAKDOWN")}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "WEEKLY_BREAKDOWN"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            4-Week Contest Audit Breakdown
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "ALL_POSTS" && (
            <div className="space-y-4">
              {posts.length > 0 ? (
                <div className="space-y-3">
                  {posts.map((post, idx) => (
                    <div
                      key={post.id || post._id || idx}
                      className="p-4 rounded-2xl border border-[var(--border-main)] bg-slate-500/5 hover:bg-slate-500/10 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Left: Thumbnail & Caption */}
                      <div className="flex items-center gap-3">
                        {post.mediaUrl && (
                          <div className="w-16 h-16 rounded-xl bg-black overflow-hidden shrink-0 border border-[var(--border-main)]">
                            {post.mediaType === "video" || post.isVideo || post.mediaUrl?.endsWith(".mp4") ? (
                              <video src={post.mediaUrl} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={post.mediaUrl} alt="Post preview" className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              {post.category || "General"}
                            </span>
                            {post.createdAt && (
                              <span className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(post.createdAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-primary)] font-medium mt-1 leading-snug line-clamp-2">
                            {post.caption || "No caption provided."}
                          </p>
                        </div>
                      </div>

                      {/* Right: Minute Metrics & Calculated Score */}
                      <div className="flex items-center gap-4 sm:gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border-main)] w-full sm:w-auto justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 font-bold text-rose-500">
                            <Heart className="w-3.5 h-3.5 fill-rose-500" /> {post.likeCount || post.likesCount || 0}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-sky-400">
                            <MessageCircle className="w-3.5 h-3.5" /> {post.commentCount || post.commentsCount || 0}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-indigo-400">
                            <Eye className="w-3.5 h-3.5" /> {post.viewCount || post.viewsCount || 0}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-[var(--text-muted)] block font-semibold uppercase">Post Score</span>
                          <span className="text-sm font-black text-amber-400 font-mono">
                            {post.score || Number(((post.likeCount || 0) * 1 + (post.commentCount || 0) * 3 + (post.viewCount || 0) * 0.2).toFixed(2))} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] italic rounded-2xl bg-slate-500/5">
                  No published posts found for this creator profile.
                </div>
              )}
            </div>
          )}

          {activeTab === "WEEKLY_BREAKDOWN" && (
            <div className="space-y-4">
              {[
                { weekNum: 1, title: "Week 1 (Aug 1 - Aug 7)", posts: week1, count: creator.week1Count },
                { weekNum: 2, title: "Week 2 (Aug 8 - Aug 14)", posts: week2, count: creator.week2Count },
                { weekNum: 3, title: "Week 3 (Aug 15 - Aug 21)", posts: week3, count: creator.week3Count },
                { weekNum: 4, title: "Week 4 (Aug 22 - Aug 28)", posts: week4, count: creator.week4Count }
              ].map((w) => {
                const isExpanded = expandedWeek === w.weekNum;
                const countVal = w.count !== undefined ? w.count : w.posts.length;

                return (
                  <div key={w.weekNum} className="rounded-2xl border border-[var(--border-main)] bg-slate-500/5 overflow-hidden">
                    <button
                      onClick={() => setExpandedWeek(isExpanded ? null : w.weekNum)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-500/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <div>
                          <span className="font-bold text-xs text-[var(--text-primary)]">{w.title}</span>
                          <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            countVal >= 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {countVal} Posts Published {countVal >= 3 ? "✓ (3+ Requirement Met)" : "(Needs 3+)"}
                          </span>
                        </div>
                      </div>

                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                    </button>

                    {isExpanded && (
                      <div className="p-4 border-t border-[var(--border-main)] space-y-3 bg-black/20">
                        {w.posts.length > 0 ? (
                          w.posts.map((p, pIdx) => (
                            <div key={p.id || pIdx} className="p-3 rounded-xl bg-slate-500/10 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold text-[var(--text-primary)]">{p.caption || "Post"}</span>
                                <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                                  {new Date(p.createdAt).toLocaleString()} • {p.category}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-right">
                                <div className="text-[11px] text-[var(--text-secondary)]">
                                  {p.likeCount || 0} L • {p.commentCount || 0} C • {p.viewCount || 0} V
                                </div>
                                <div className="font-bold text-amber-400 font-mono text-xs">
                                  {p.score} pts
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-[var(--text-muted)] italic">No posts published during this week.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-main)] bg-slate-500/5 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-500/20 hover:bg-slate-500/30 text-[var(--text-primary)] font-bold text-xs transition-colors"
          >
            Close Tracking Details
          </button>
        </div>
      </div>
    </div>
  );
};
