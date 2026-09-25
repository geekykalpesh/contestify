import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateKycThunk } from "../store/adminSlice";
import { AdminWinnerModal } from "./AdminWinnerModal";
import { TableRowsShimmer } from "./AdminSkeletonLoaders";
import { Trophy, CheckCircle, XCircle, AlertCircle, RefreshCw, Zap, Eye, Filter, ExternalLink, User } from "lucide-react";

export const AdminTable = ({ winners = [], summary, onRefresh }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { lastCascadeNotice, loading } = useSelector((state) => state.admin);
  const [selectedWinnerNotes, setSelectedWinnerNotes] = useState("");
  const [inspectWinner, setInspectWinner] = useState(null);
  const [tierFilter, setTierFilter] = useState("ALL");

  const handleKycStatusChange = (winnerId, newStatus) => {
    dispatch(updateKycThunk({ winnerId, status: newStatus, notes: selectedWinnerNotes }));
  };

  const handleProfileClick = (e, identifier) => {
    e.stopPropagation();
    if (identifier && identifier !== "UNAWARDED") {
      navigate(`/profile/${identifier}`);
    }
  };

  const filteredWinners = winners.filter((w) => {
    if (tierFilter === "GRAND") return w.tier === "GRAND_CHAMPION" || w.tier === "GRAND_PRIZE";
    if (tierFilter === "BUMPER") return w.tier.startsWith("BUMPER") || w.tier.startsWith("TOP_PERFORMER");
    if (tierFilter === "WEEKLY") return w.tier.startsWith("WEEKLY") || w.tier.startsWith("CATEGORY");
    if (tierFilter === "CONSISTENCY") return w.tier.startsWith("CONSISTENCY");
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ig-card p-4 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Total Eligible Users</div>
          <div className="text-2xl font-black text-sky-500 mt-1 font-mono">
            {summary?.totalEligibleUsers || 0}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Chhattisgarh Residents Only</div>
        </div>

        <div className="ig-card p-4 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Total Contest Posts</div>
          <div className="text-2xl font-black text-purple-500 mt-1 font-mono">
            {summary?.totalEligiblePosts || 0}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Evaluated in Ranking Engine</div>
        </div>

        <div className="ig-card p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Prizes Allocated</div>
          <div className="text-2xl font-black text-amber-500 mt-1 font-mono">
            {summary?.prizesAwarded || 0} / 33
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Strict Priority Hierarchy</div>
        </div>

        <div className="ig-card p-4 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Disqualified / Failed KYC</div>
          <div className="text-2xl font-black text-rose-500 mt-1 font-mono">
            {summary?.disqualifiedCount || 0}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Cascaded Down to Next Person</div>
        </div>
      </div>

      {/* Cascade Notification Banner */}
      {lastCascadeNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-semibold">{lastCascadeNotice}</span>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="ig-card rounded-2xl overflow-hidden shadow-lg border border-[var(--border-main)]">
        <div className="p-4 border-b border-[var(--border-main)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-500/5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-base">33 Contest Prize Allocation Table</h3>
              <p className="text-[10px] text-[var(--text-secondary)]">
                Priority Cascade order • Click any winner @username to visit their actual user profile page.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-500/10 border border-[var(--border-main)] text-xs text-[var(--text-primary)] font-semibold focus:outline-none"
            >
              <option value="ALL">All Tiers (33 Prizes)</option>
              <option value="GRAND">Grand Champion</option>
              <option value="BUMPER">Top Performers</option>
              <option value="WEEKLY">Category Champions</option>
              <option value="CONSISTENCY">Consistency Bonuses</option>
            </select>

            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-[var(--text-primary)] text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-slate-500/10 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                <th className="py-3 px-4">Priority #</th>
                <th className="py-3 px-4">Prize Tier</th>
                <th className="py-3 px-4">Winner @Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4 text-center">Post Preview</th>
                <th className="py-3 px-4 text-right">KYC Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)] text-xs">
              {loading ? (
                <TableRowsShimmer rows={6} columns={8} />
              ) : (
                filteredWinners.map((w, idx) => {
                const isUnawarded = w.userId === "UNAWARDED";
                const isFailed = w.kycStatus === "FAILED";
                const isPassed = w.kycStatus === "PASSED";
                const usernameDisplay = w.username || w.userEmail?.split("@")[0] || (w.userName ? w.userName.toLowerCase().replace(/\s+/g, "_") : "unknown");

                return (
                  <tr
                    key={`${w.tier}_${w.tierCategory || idx}`}
                    className={`hover:bg-slate-500/5 transition-colors ${
                      isFailed ? "bg-rose-500/10" : isPassed ? "bg-emerald-500/10" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-sky-500">
                      #{w.priorityIndex || idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-[var(--text-primary)]">
                        {w.tier.replace(/_/g, " ")}
                      </div>
                      {w.tierCategory && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 mt-0.5">
                          {w.tierCategory}
                        </span>
                      )}
                    </td>

                    {/* Winner Username & Profile Link */}
                    <td className="py-3 px-4">
                      {isUnawarded ? (
                        <span className="text-[var(--text-muted)] italic font-semibold text-[11px]">
                          Unawarded Category Slot
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleProfileClick(e, usernameDisplay || w.userId)}
                          className="text-left group cursor-pointer"
                          title={`Click to view profile of @${usernameDisplay}`}
                        >
                          <div className="font-extrabold text-sky-400 group-hover:underline inline-flex items-center gap-1 text-xs">
                            <span>@{usernameDisplay}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
                            {(w.userName || "").replace(/\s*\([^)]*\)/g, "").trim()}
                          </div>
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[var(--text-secondary)] font-mono text-[11px]">
                      {w.userEmail}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-extrabold text-amber-500 font-mono">
                        {w.score || 0}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {isUnawarded ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-500/10 text-[var(--text-muted)]">
                          N/A
                        </span>
                      ) : isPassed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> PASSED
                        </span>
                      ) : isFailed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> FAILED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertCircle className="w-3 h-3" /> PENDING
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {!isUnawarded && (
                        <button
                          onClick={() => setInspectWinner(w)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold text-[10px] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Inspect Post
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!isUnawarded && (
                        <div className="flex items-center justify-end gap-1.5">
                          {w.kycStatus !== "PASSED" && (
                            <button
                              onClick={() => handleKycStatusChange(w.userId, "PASSED")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm transition-colors cursor-pointer"
                            >
                              Pass KYC
                            </button>
                          )}
                          {w.kycStatus !== "FAILED" && (
                            <button
                              onClick={() => handleKycStatusChange(w.userId, "FAILED")}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shadow-sm transition-colors cursor-pointer"
                            >
                              Fail KYC (Cascade)
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Winner Post Details Modal */}
      {inspectWinner && (
        <AdminWinnerModal
          winner={inspectWinner}
          onClose={() => setInspectWinner(null)}
        />
      )}
    </div>
  );
};
