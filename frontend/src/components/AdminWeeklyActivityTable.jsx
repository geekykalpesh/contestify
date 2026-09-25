import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Calendar, CheckCircle2, XCircle, Search, Eye, Sparkles, ExternalLink } from "lucide-react";
import { AdminCreatorDetailsModal } from "./AdminCreatorDetailsModal";
import { TableRowsShimmer } from "./AdminSkeletonLoaders";

export const AdminWeeklyActivityTable = ({ weeklyActivity = [] }) => {
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCreator, setSelectedCreator] = useState(null);

  const filtered = weeklyActivity.filter((item) =>
    item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="ig-card rounded-2xl overflow-hidden shadow-lg border border-[var(--border-main)]">
        {/* Header & Search */}
        <div className="p-4 border-b border-[var(--border-main)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-500/5">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-[var(--text-primary)] text-base">
                Weekly Activity Audit Matrix (4 Weeks Contest Period)
              </h3>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Audit creator posting frequency per week. Minimum 3 posts per week required for Grand Champion & Consistency Bonus eligibility. Click @username to view their profile.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search creator name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-500/10 border border-[var(--border-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* MOBILE CARDS VIEW (< md) */}
        <div className="block md:hidden divide-y divide-[var(--border-main)]">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading weekly activity...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">No activity matching search criteria.</div>
          ) : (
            filtered.map((user) => {
              const isConsistent = user.isConsistencyEligible;
              const w1 = user.week1Count || 0;
              const w2 = user.week2Count || 0;
              const w3 = user.week3Count || 0;
              const w4 = user.week4Count || 0;
              const usernameDisplay = user.username || user.userEmail?.split("@")[0] || (user.userName ? user.userName.toLowerCase().replace(/\s+/g, "_") : "unknown");

              return (
                <div
                  key={user.userId}
                  onClick={() => setSelectedCreator(user)}
                  className="p-3.5 space-y-2.5 hover:bg-slate-500/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${usernameDisplay || user.userId}`);
                        }}
                        className="text-left group cursor-pointer"
                      >
                        <div className="font-extrabold text-sky-400 group-hover:underline inline-flex items-center gap-1 text-xs">
                          <span>@{usernameDisplay}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] font-medium">
                          {(user.userName || "").replace(/\s*\([^)]*\)/g, "").trim()}
                        </div>
                      </button>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{user.userEmail}</div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isConsistent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Eligible (3+/wk)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/10 text-[var(--text-muted)] border border-slate-500/20 text-[10px] font-semibold">
                          <XCircle className="w-3 h-3 text-rose-400" /> Ineligible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4 Weeks Grid Badges */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-500/10 border border-[var(--border-main)]/50">
                      <div className="text-[9px] uppercase text-[var(--text-muted)] font-bold">W1</div>
                      <div className={`text-xs font-extrabold ${w1 >= 3 ? "text-emerald-400" : "text-amber-400"}`}>{w1}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-500/10 border border-[var(--border-main)]/50">
                      <div className="text-[9px] uppercase text-[var(--text-muted)] font-bold">W2</div>
                      <div className={`text-xs font-extrabold ${w2 >= 3 ? "text-emerald-400" : "text-amber-400"}`}>{w2}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-500/10 border border-[var(--border-main)]/50">
                      <div className="text-[9px] uppercase text-[var(--text-muted)] font-bold">W3</div>
                      <div className={`text-xs font-extrabold ${w3 >= 3 ? "text-emerald-400" : "text-amber-400"}`}>{w3}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-500/10 border border-[var(--border-main)]/50">
                      <div className="text-[9px] uppercase text-[var(--text-muted)] font-bold">W4</div>
                      <div className={`text-xs font-extrabold ${w4 >= 3 ? "text-emerald-400" : "text-amber-400"}`}>{w4}</div>
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-main)]/50">
                    <div className="text-xs font-bold text-[var(--text-primary)] font-mono">
                      Total: {user.totalPosts} posts • <span className="text-amber-400">{user.consistencyScore || 0} pts</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCreator(user);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold text-[10px] transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-slate-500/10 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                <th className="py-3 px-4">Creator Profile (@Username)</th>
                <th className="py-3 px-4 text-center">W1 (Aug 1 - 7)</th>
                <th className="py-3 px-4 text-center">W2 (Aug 8 - 14)</th>
                <th className="py-3 px-4 text-center">W3 (Aug 15 - 21)</th>
                <th className="py-3 px-4 text-center">W4 (Aug 22 - 28)</th>
                <th className="py-3 px-4 text-center">Total Posts</th>
                <th className="py-3 px-4 text-center">Consistency Qualified</th>
                <th className="py-3 px-4 text-center">Top-3 Combined Score</th>
                <th className="py-3 px-4 text-right">Minute Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)] text-xs">
              {loading ? (
                <TableRowsShimmer rows={6} columns={9} />
              ) : filtered.length > 0 ? (
                filtered.map((user) => {
                  const isConsistent = user.isConsistencyEligible;
                  const w1 = user.week1Count || 0;
                  const w2 = user.week2Count || 0;
                  const w3 = user.week3Count || 0;
                  const w4 = user.week4Count || 0;
                  const usernameDisplay = user.username || user.userEmail?.split("@")[0] || (user.userName ? user.userName.toLowerCase().replace(/\s+/g, "_") : "unknown");

                  return (
                    <tr
                      key={user.userId}
                      onClick={() => setSelectedCreator(user)}
                      className="hover:bg-slate-500/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${usernameDisplay || user.userId}`);
                          }}
                          className="text-left group cursor-pointer"
                          title={`Click to view profile of @${usernameDisplay}`}
                        >
                          <div className="font-extrabold text-sky-400 group-hover:underline inline-flex items-center gap-1 text-xs">
                            <span>@{usernameDisplay}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
                            {(user.userName || "").replace(/\s*\([^)]*\)/g, "").trim()}
                          </div>
                        </button>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">{user.userEmail}</div>
                      </td>

                      {/* Week 1 */}
                      <td className="py-3 px-4 text-center">
                        <div className={`font-mono font-bold text-sm ${w1 >= 3 ? "text-emerald-400" : "text-amber-400"}`}>
                          {w1} {w1 === 1 ? "post" : "posts"}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] font-mono">Max: {user.week1MaxScore || 0} pts</div>
                      </td>

                      {/* Week 2 */}
                      <td className="py-3 px-4 text-center">
                        <div className={`font-mono font-bold text-sm ${w2 >= 3 ? "text-emerald-400" : "text-amber-400"}`}>
                          {w2} {w2 === 1 ? "post" : "posts"}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] font-mono">Max: {user.week2MaxScore || 0} pts</div>
                      </td>

                      {/* Week 3 */}
                      <td className="py-3 px-4 text-center">
                        <div className={`font-mono font-bold text-sm ${w3 >= 3 ? "text-emerald-400" : "text-amber-400"}`}>
                          {w3} {w3 === 1 ? "post" : "posts"}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] font-mono">Max: {user.week3MaxScore || 0} pts</div>
                      </td>

                      {/* Week 4 */}
                      <td className="py-3 px-4 text-center">
                        <div className={`font-mono font-bold text-sm ${w4 >= 3 ? "text-emerald-400" : "text-amber-400"}`}>
                          {w4} {w4 === 1 ? "post" : "posts"}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] font-mono">Max: {user.week4MaxScore || 0} pts</div>
                      </td>

                      {/* Total Posts */}
                      <td className="py-3 px-4 text-center font-bold text-[var(--text-primary)] font-mono text-sm">
                        {user.totalPosts}
                      </td>

                      {/* Consistency Badge */}
                      <td className="py-3 px-4 text-center">
                        {isConsistent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Eligible (3+/wk)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/10 text-[var(--text-muted)] border border-slate-500/20 text-[10px] font-semibold">
                            <XCircle className="w-3 h-3 text-rose-400" /> Ineligible (&lt;3/wk)
                          </span>
                        )}
                      </td>

                      {/* Top 3 Score */}
                      <td className="py-3 px-4 text-center font-black text-amber-400 text-sm font-mono">
                        {user.consistencyScore || 0} pts
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCreator(user);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold text-[10px] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-xs text-[var(--text-muted)]">
                    No activity matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creator Minute Tracking Details Modal */}
      {selectedCreator && (
        <AdminCreatorDetailsModal
          creator={selectedCreator}
          onClose={() => setSelectedCreator(null)}
        />
      )}
    </div>
  );
};
