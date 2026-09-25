import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchPaginatedParticipants,
  setFilterParams,
  toggleUserSelection,
  selectAllCurrentPageUsers,
  clearUserSelection,
  bulkUpdateKycThunk
} from "../store/adminSlice";
import {
  Users,
  Search,
  Filter,
  Heart,
  MessageCircle,
  Eye,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import { AdminCreatorDetailsModal } from "./AdminCreatorDetailsModal";
import { TableRowsShimmer } from "./AdminSkeletonLoaders";

export const AdminParticipantsTable = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    paginatedUsers,
    paginationMeta,
    filterParams,
    selectedUserIds,
    participantsLoading,
    bulkLoading
  } = useSelector((state) => state.admin);

  const [searchTerm, setSearchTerm] = useState(filterParams.search || "");
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [jumpPageInput, setJumpPageInput] = useState("");

  // Debounced search dispatch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filterParams.search) {
        dispatch(setFilterParams({ search: searchTerm, page: 1 }));
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, filterParams.search, dispatch]);

  // Fetch paginated users whenever filter parameters change
  useEffect(() => {
    dispatch(fetchPaginatedParticipants(filterParams));
  }, [dispatch, filterParams]);

  const handlePageChange = (newPage) => {
    const validPage = Math.max(1, Math.min(newPage, paginationMeta.totalPages));
    dispatch(setFilterParams({ page: validPage }));
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value) || 20;
    dispatch(setFilterParams({ limit: newLimit, page: 1 }));
  };

  const handleResidencyFilter = (e) => {
    dispatch(setFilterParams({ residency: e.target.value, page: 1 }));
  };

  const handleKycFilter = (e) => {
    dispatch(setFilterParams({ kycStatus: e.target.value, page: 1 }));
  };

  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split(":");
    dispatch(setFilterParams({ sortBy, sortOrder }));
  };

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBulkKycAction = (status) => {
    if (selectedUserIds.length === 0) return;
    dispatch(
      bulkUpdateKycThunk({
        userIds: selectedUserIds,
        status,
        notes: `Bulk ${status} action from Admin Directory toolbar`
      })
    ).then(() => {
      dispatch(fetchPaginatedParticipants(filterParams));
    });
  };

  const handleExportCsv = () => {
    const API_BASE = import.meta.env.VITE_ADMIN_SERVICE_URL || "http://localhost:5002";
    window.open(`${API_BASE}/api/admin/users/export`, "_blank");
  };

  const allPageSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((u) => selectedUserIds.includes(u.id || u.userId));

  return (
    <div className="space-y-6">
      <div className="ig-card rounded-2xl overflow-hidden shadow-xl border border-[var(--border-main)] bg-[var(--bg-card)]">
        {/* Header & Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-500/5">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <h3 className="font-extrabold text-[var(--text-primary)] text-base">
                Server-Paginated Creator Directory & KYC Management
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                High-Scale 10M Ready
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Search, filter, and audit millions of registered users with indexed server queries, cumulative engagement metrics, and batch KYC actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* CSV Export Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-[var(--text-primary)] border border-[var(--border-main)] text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export CSV</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => dispatch(fetchPaginatedParticipants(filterParams))}
              disabled={participantsLoading}
              className="p-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-[var(--text-primary)] border border-[var(--border-main)] transition-colors cursor-pointer"
              title="Refresh Current Page"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${participantsLoading ? "animate-spin text-sky-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-[var(--border-main)] bg-slate-500/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search name, email, username or User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-500/10 border border-[var(--border-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Residency Filter */}
          <div>
            <select
              value={filterParams.residency}
              onChange={handleResidencyFilter}
              className="w-full px-3 py-2 rounded-xl bg-slate-500/10 border border-[var(--border-main)] text-xs text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All States (All Users)</option>
              <option value="Chhattisgarh">Chhattisgarh Only (Eligible)</option>
              <option value="NON_CG">Outside CG (Ineligible)</option>
            </select>
          </div>

          {/* KYC Status Filter */}
          <div>
            <select
              value={filterParams.kycStatus}
              onChange={handleKycFilter}
              className="w-full px-3 py-2 rounded-xl bg-slate-500/10 border border-[var(--border-main)] text-xs text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All KYC Statuses</option>
              <option value="PENDING">KYC Pending</option>
              <option value="PASSED">KYC Passed</option>
              <option value="FAILED">KYC Failed / Rejected</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${filterParams.sortBy}:${filterParams.sortOrder}`}
              onChange={handleSortChange}
              className="w-full px-3 py-2 rounded-xl bg-slate-500/10 border border-[var(--border-main)] text-xs text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="name:asc">Name (A to Z)</option>
              <option value="email:asc">Email (A to Z)</option>
              <option value="kycStatus:desc">KYC Status</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto relative min-h-[300px]">
          {participantsLoading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-sky-500/30 text-sky-400 text-xs font-bold shadow-xl animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Querying Server Database...</span>
              </div>
            </div>
          )}

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-slate-500/10 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={() => dispatch(selectAllCurrentPageUsers())}
                    className="rounded border-slate-600 text-sky-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Creator Identity</th>
                <th className="py-3 px-4">Residency Status</th>
                <th className="py-3 px-4 text-center">KYC Verification</th>
                <th className="py-3 px-4 text-center">Posts</th>
                <th className="py-3 px-4 text-center">Total Engagement</th>
                <th className="py-3 px-4 text-center">Max Single Score</th>
                <th className="py-3 px-4 text-center">Prize Allocated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-main)] text-xs">
              {participantsLoading ? (
                <TableRowsShimmer rows={8} columns={9} />
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((p) => {
                  const uid = p.id || p.userId;
                  const isSelected = selectedUserIds.includes(uid);
                  const isCG = p.residency === "Chhattisgarh";
                  const kyc = p.kycStatus || "NOT_SUBMITTED";

                  return (
                    <tr
                      key={uid}
                      onClick={() => setSelectedCreator(p)}
                      className={`hover:bg-slate-500/5 transition-colors cursor-pointer ${
                        isSelected ? "bg-sky-500/10" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => dispatch(toggleUserSelection(uid))}
                          className="rounded border-slate-600 text-sky-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Creator Name & Email & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-500/30 shrink-0">
                            {(p.username || p.userName || p.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${p.username || uid}`);
                              }}
                              className="text-left group cursor-pointer"
                              title={`Click to visit profile of @${p.username || p.userName}`}
                            >
                              <div className="font-extrabold text-sky-400 group-hover:underline inline-flex items-center gap-1 text-xs">
                                <span>@{p.username || p.userEmail?.split("@")[0] || (p.userName || p.name || "").toLowerCase().replace(/\s+/g, "_")}</span>
                                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
                                {(p.userName || p.name || "").replace(/\s*\([^)]*\)/g, "").trim()}
                              </div>
                            </button>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{p.userEmail || p.email}</span>
                              <button
                                onClick={(e) => handleCopyId(e, uid)}
                                className="p-0.5 rounded hover:bg-slate-500/20 text-[var(--text-muted)] hover:text-sky-400 transition-colors cursor-pointer"
                                title="Copy User ID"
                              >
                                {copiedId === uid ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Residency */}
                      <td className="py-3 px-4">
                        {isCG ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            CG Resident (Eligible)
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-500/10 text-[var(--text-muted)] border border-slate-500/20 text-[10px] font-semibold">
                            {p.residency || "Outside CG"} (Ineligible)
                          </span>
                        )}
                      </td>

                      {/* KYC Verification Badge */}
                      <td className="py-3 px-4 text-center">
                        {kyc === "PASSED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> PASSED
                          </span>
                        ) : kyc === "FAILED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" /> FAILED
                          </span>
                        ) : kyc === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-500/10 text-[var(--text-muted)]">
                            Not Submitted
                          </span>
                        )}
                      </td>

                      {/* Posts Count */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-[var(--text-primary)]">
                        {p.totalPosts || 0}
                      </td>

                      {/* Cumulative Engagement */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-[11px] font-mono font-semibold">
                          <span className="text-rose-400 flex items-center gap-0.5">
                            <Heart className="w-3 h-3 fill-rose-400" /> {p.totalLikes || 0}
                          </span>
                          <span className="text-sky-400 flex items-center gap-0.5">
                            <MessageCircle className="w-3 h-3" /> {p.totalComments || 0}
                          </span>
                          <span className="text-indigo-400 flex items-center gap-0.5">
                            <Eye className="w-3 h-3" /> {p.totalViews || 0}
                          </span>
                        </div>
                      </td>

                      {/* Max Score */}
                      <td className="py-3 px-4 text-center font-extrabold text-amber-400 font-mono text-sm">
                        {p.maxScore || 0} pts
                      </td>

                      {/* Prize Tier */}
                      <td className="py-3 px-4 text-center">
                        {p.prizeTier ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Award className="w-3 h-3" /> {p.prizeTier.replace(/_/g, " ")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] italic">
                            No Prize Allocated
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedCreator(p)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold text-[10px] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Inspect Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-xs text-[var(--text-muted)]">
                    No creators found matching current filter query parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination Control Bar */}
        <div className="p-4 border-t border-[var(--border-main)] bg-slate-500/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-3">
            <span className="font-medium">
              Showing{" "}
              <span className="font-bold text-[var(--text-primary)]">
                {paginationMeta.total > 0 ? (paginationMeta.page - 1) * paginationMeta.limit + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-bold text-[var(--text-primary)]">
                {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)}
              </span>{" "}
              of <span className="font-bold text-sky-400 font-mono">{paginationMeta.total.toLocaleString()}</span> entries
            </span>

            {/* Per Page Selector */}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Per Page:</span>
              <select
                value={filterParams.limit}
                onChange={handleLimitChange}
                className="px-2 py-1 rounded-lg bg-slate-500/10 border border-[var(--border-main)] text-xs text-[var(--text-primary)] font-bold focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>

          {/* Page Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(1)}
              disabled={paginationMeta.page <= 1}
              className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-40 text-[var(--text-primary)] transition-colors cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => handlePageChange(paginationMeta.page - 1)}
              disabled={paginationMeta.page <= 1}
              className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-40 text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-mono font-bold text-xs text-[var(--text-primary)] bg-slate-500/10 rounded-lg border border-[var(--border-main)]">
              Page {paginationMeta.page} of {paginationMeta.totalPages || 1}
            </span>

            <button
              onClick={() => handlePageChange(paginationMeta.page + 1)}
              disabled={paginationMeta.page >= paginationMeta.totalPages}
              className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-40 text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handlePageChange(paginationMeta.totalPages)}
              disabled={paginationMeta.page >= paginationMeta.totalPages}
              className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-40 text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Contextual Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-sky-500/40 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl w-[90%] text-xs text-white animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-black font-black flex items-center justify-center text-xs">
              {selectedUserIds.length}
            </span>
            <span className="font-bold">Creators Selected for Bulk Action</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleBulkKycAction("PASSED")}
              disabled={bulkLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve KYC</span>
            </button>

            <button
              onClick={() => handleBulkKycAction("FAILED")}
              disabled={bulkLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject KYC</span>
            </button>

            <button
              onClick={() => dispatch(clearUserSelection())}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Creator Details Drawer / Modal */}
      {selectedCreator && (
        <AdminCreatorDetailsModal
          creator={selectedCreator}
          onClose={() => setSelectedCreator(null)}
        />
      )}
    </div>
  );
};
