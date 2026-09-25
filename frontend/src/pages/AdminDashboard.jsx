import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWinners,
  fetchAdminStats,
  setFilterParams
} from "../store/adminSlice";
import { AdminTable } from "../components/AdminTable";
import { AdminWeeklyActivityTable } from "../components/AdminWeeklyActivityTable";
import { AdminParticipantsTable } from "../components/AdminParticipantsTable";
import { AdminAuditLogsTable } from "../components/AdminAuditLogsTable";
import { KpiCardsShimmer } from "../components/AdminSkeletonLoaders";
import {
  Trophy,
  RefreshCw,
  Calendar,
  Users,
  Shield,
  CheckCircle2,
  Zap,
  Activity,
  Award,
  Layers,
  Sparkles,
  Server,
  FileCheck
} from "lucide-react";

export const AdminDashboard = () => {
  const dispatch = useDispatch();
  const {
    winners,
    summary,
    weeklyActivity,
    allParticipants,
    kycAuditLogs,
    stats,
    loading,
    error
  } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState("WINNERS"); // WINNERS, PARTICIPANTS, WEEKLY, LOGS
  const [syncNotice, setSyncNotice] = useState(null);

  useEffect(() => {
    dispatch(fetchWinners());
    dispatch(fetchAdminStats());
  }, [dispatch]);

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        dispatch(fetchWinners()).unwrap(),
        dispatch(fetchAdminStats()).unwrap()
      ]);
      setSyncNotice("All contest prize allocations & high-scale 10M metrics synced successfully!");
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err) {
      console.error("Failed to re-compute admin data", err);
    }
  };

  const handleStatCardClick = (filterField, filterValue) => {
    setActiveTab("PARTICIPANTS");
    dispatch(setFilterParams({ [filterField]: filterValue, page: 1 }));
  };

  // Combine local stats or summary
  const totalUsersDisplay = (stats.totalUsers || summary?.totalEligibleUsers || 0).toLocaleString();
  const cgEligibleDisplay = (stats.totalCgEligible || summary?.totalEligibleUsers || 0).toLocaleString();
  const pendingKycDisplay = (stats.kycPending || 0).toLocaleString();
  const prizesAwardedDisplay = summary?.prizesAwarded || stats.prizesAllocated || 0;
  const totalPostsDisplay = (stats.totalPosts || summary?.totalEligiblePosts || 0).toLocaleString();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Admin Header & Live System Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--border-main)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-lg shadow-amber-500/10">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                  Contestify Admin Command Center
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-extrabold tracking-wider uppercase font-mono">
                  <Server className="w-3 h-3 text-indigo-400" />
                  10M User Engine
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Real-Time 33-Prize Priority Allocation Cascade • Indexed Server Queries • Postgres KYC Ledger
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Re-computing Engine..." : "Re-compute & Sync All Data"}</span>
          </button>
        </div>
      </div>

      {/* Sync Notice Alert */}
      {syncNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{syncNotice}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          Admin Service Notice: {error}
        </div>
      )}

      {/* Interactive System Analytics KPI Grid */}
      {loading ? (
        <KpiCardsShimmer count={5} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Users */}
          <div
            onClick={() => handleStatCardClick("residency", "ALL")}
            className="ig-card p-4 rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-transparent hover:border-sky-500/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>Total Registered</span>
              <Users className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-sky-400 mt-2 font-mono">
              {totalUsersDisplay}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1 font-mono">
              <span>Indexed in Mongo & Postgres</span>
            </div>
          </div>

          {/* Card 2: CG Eligible */}
          <div
            onClick={() => handleStatCardClick("residency", "Chhattisgarh")}
            className="ig-card p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent hover:border-emerald-500/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>CG Eligible Residents</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
              {cgEligibleDisplay}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1 font-mono">
              <span>Verified Residency Rule</span>
            </div>
          </div>

          {/* Card 3: Pending KYC Queue */}
          <div
            onClick={() => handleStatCardClick("kycStatus", "PENDING")}
            className="ig-card p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent hover:border-amber-500/60 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>Pending KYC Queue</span>
              <FileCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
              {pendingKycDisplay}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1 font-semibold">
              <span>Click to Review Queue →</span>
            </div>
          </div>

          {/* Card 4: 33 Prizes Allocated */}
          <div
            onClick={() => setActiveTab("WINNERS")}
            className="ig-card p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent hover:border-purple-500/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>33 Prizes Allocated</span>
              <Award className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-purple-400 mt-2 font-mono">
              {prizesAwardedDisplay} / 33
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1 font-mono">
              <span>Priority Cascade Hierarchy</span>
            </div>
          </div>

          {/* Card 5: Total Posts Evaluated */}
          <div className="ig-card p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-transparent hover:border-indigo-500/60 transition-all">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>Total Media Posts</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-400 mt-2 font-mono">
              {totalPostsDisplay}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1 font-mono">
              <span>Likes + Comments + Views</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("WINNERS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === "WINNERS"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
              : "text-[var(--text-secondary)] hover:bg-slate-500/10 hover:text-[var(--text-primary)]"
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>🏆 33 Prize Allocation Cascade ({winners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PARTICIPANTS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === "PARTICIPANTS"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm"
              : "text-[var(--text-secondary)] hover:bg-slate-500/10 hover:text-[var(--text-primary)]"
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>👥 Millions Creator Directory (Paginated)</span>
        </button>

        <button
          onClick={() => setActiveTab("WEEKLY")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === "WEEKLY"
              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
              : "text-[var(--text-secondary)] hover:bg-slate-500/10 hover:text-[var(--text-primary)]"
          }`}
        >
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>📅 Weekly Activity Audit ({weeklyActivity.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("LOGS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === "LOGS"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
              : "text-[var(--text-secondary)] hover:bg-slate-500/10 hover:text-[var(--text-primary)]"
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>🛡️ KYC Audit Trail ({kycAuditLogs.length})</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === "WINNERS" && (
        <AdminTable winners={winners} summary={summary} onRefresh={handleRefreshAll} />
      )}

      {activeTab === "PARTICIPANTS" && <AdminParticipantsTable />}

      {activeTab === "WEEKLY" && (
        <AdminWeeklyActivityTable weeklyActivity={weeklyActivity} />
      )}

      {activeTab === "LOGS" && (
        <AdminAuditLogsTable auditLogs={kycAuditLogs} />
      )}
    </div>
  );
};
