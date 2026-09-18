import React, { useState } from "react";
import { Users, Search, Filter, Heart, MessageCircle, Eye, Award } from "lucide-react";
import { AdminCreatorDetailsModal } from "./AdminCreatorDetailsModal";

export const AdminParticipantsTable = ({ participants = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("ALL"); // ALL, CG, NON_CG
  const [selectedCreator, setSelectedCreator] = useState(null);

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const isCG = p.residency === "Chhattisgarh";
    if (stateFilter === "CG") return matchesSearch && isCG;
    if (stateFilter === "NON_CG") return matchesSearch && !isCG;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="ig-card rounded-2xl overflow-hidden shadow-lg border border-[var(--border-main)]">
        {/* Header & Controls */}
        <div className="p-4 border-b border-[var(--border-main)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-500/5">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-[var(--text-primary)] text-base">
                All Participants & Engagement Directory
              </h3>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Audit all registered creators across Chhattisgarh and outside states with cumulative engagement statistics. Click any row to view minute-by-minute post tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* State Filter */}
            <div className="relative">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-500/10 border border-[var(--border-main)] text-xs text-[var(--text-primary)] font-semibold focus:outline-none"
              >
                <option value="ALL">All States ({participants.length})</option>
                <option value="CG">Chhattisgarh Only ({participants.filter(p => p.residency === "Chhattisgarh").length})</option>
                <option value="NON_CG">Outside CG ({participants.filter(p => p.residency !== "Chhattisgarh").length})</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search user or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-500/10 border border-[var(--border-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-slate-500/10 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                <th className="py-3 px-4">Creator</th>
                <th className="py-3 px-4">Residency Badge</th>
                <th className="py-3 px-4 text-center">Total Posts</th>
                <th className="py-3 px-4 text-center">Total Likes</th>
                <th className="py-3 px-4 text-center">Total Comments</th>
                <th className="py-3 px-4 text-center">Total Views</th>
                <th className="py-3 px-4 text-center">Top Single Score</th>
                <th className="py-3 px-4 text-center">Prize Allocated</th>
                <th className="py-3 px-4 text-right">Minute Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)] text-xs">
              {filtered.length > 0 ? (
                filtered.map((p) => {
                  const isCG = p.residency === "Chhattisgarh";

                  return (
                    <tr
                      key={p.userId}
                      onClick={() => setSelectedCreator(p)}
                      className="hover:bg-slate-500/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-[var(--text-primary)]">{p.userName}</div>
                        <div className="text-[11px] text-[var(--text-secondary)] font-mono">{p.userEmail}</div>
                      </td>

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

                      <td className="py-3 px-4 text-center font-mono font-bold text-[var(--text-primary)] text-sm">
                        {p.totalPosts || 0}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-400 font-mono">
                          <Heart className="w-3 h-3 fill-rose-400" /> {p.totalLikes || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-sky-400 font-mono">
                          <MessageCircle className="w-3 h-3" /> {p.totalComments || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-400 font-mono">
                          <Eye className="w-3 h-3" /> {p.totalViews || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-extrabold text-amber-400 font-mono text-sm">
                        {p.maxScore || 0} pts
                      </td>

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

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCreator(p);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold text-[10px] transition-colors"
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
                    No creators found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creator Minute Details Modal */}
      {selectedCreator && (
        <AdminCreatorDetailsModal
          creator={selectedCreator}
          onClose={() => setSelectedCreator(null)}
        />
      )}
    </div>
  );
};
