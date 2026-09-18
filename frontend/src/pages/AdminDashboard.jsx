import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchWinners } from "../store/adminSlice";
import { AdminTable } from "../components/AdminTable";
import { AdminWeeklyActivityTable } from "../components/AdminWeeklyActivityTable";
import { AdminParticipantsTable } from "../components/AdminParticipantsTable";
import { AdminAuditLogsTable } from "../components/AdminAuditLogsTable";
import { Trophy, RefreshCw, Calendar, Users, Shield, CheckCircle2 } from "lucide-react";

export const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { winners, summary, weeklyActivity, allParticipants, kycAuditLogs, loading, error } = useSelector((state) => state.admin);
  const [activeTab, setActiveTab] = useState("WINNERS"); // WINNERS, WEEKLY, PARTICIPANTS, LOGS
  const [syncNotice, setSyncNotice] = useState(null);

  useEffect(() => {
    dispatch(fetchWinners());
  }, [dispatch]);

  const handleRefresh = async () => {
    try {
      await dispatch(fetchWinners()).unwrap();
      setSyncNotice("All 33 contest prize rankings & activity data successfully re-computed and synced!");
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err) {
      console.error("Failed to re-compute admin data", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--border-main)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500 animate-pulse" />
            <h1 className="text-2xl font-black text-[var(--text-primary)]">
              Admin Contest Command Center
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time 33 Prize Allocation Cascade Engine • Weekly Activity Audit • Creator Directory • PostgreSQL KYC Ledger
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Re-computing..." : "Re-compute & Sync All Data"}</span>
        </button>
      </div>

      {syncNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{syncNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          Error loading Admin Service: {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("WINNERS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "WINNERS"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
              : "text-[var(--text-secondary)] hover:bg-slate-500/10 hover:text-[var(--text-primary)]"
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>🏆 33 Prize Allocation ({winners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("WEEKLY")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "WEEKLY"
              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
              : "text-[var(--text-secondary)] hover:bg-slate-500/10 hover:text-[var(--text-primary)]"
          }`}
        >
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>📅 Weekly Activity Audit ({weeklyActivity.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PARTICIPANTS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "PARTICIPANTS"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm"
              : "text-[var(--text-secondary)] hover:bg-slate-500/10 hover:text-[var(--text-primary)]"
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>👥 All Participants Directory ({allParticipants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("LOGS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
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
        <AdminTable winners={winners} summary={summary} onRefresh={handleRefresh} />
      )}

      {activeTab === "WEEKLY" && (
        <AdminWeeklyActivityTable weeklyActivity={weeklyActivity} />
      )}

      {activeTab === "PARTICIPANTS" && (
        <AdminParticipantsTable participants={allParticipants} />
      )}

      {activeTab === "LOGS" && (
        <AdminAuditLogsTable auditLogs={kycAuditLogs} />
      )}
    </div>
  );
};
