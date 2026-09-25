import React from "react";

/**
 * Shimmer skeleton loaders for high-scale Admin Panel data syncing
 */
export const KpiCardsShimmer = ({ count = 5 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="ig-card p-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] relative overflow-hidden space-y-3"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-24 rounded-md bg-slate-500/20 shimmer-effect" />
            <div className="w-5 h-5 rounded-full bg-slate-500/20 shimmer-effect" />
          </div>

          {/* Number Big Stat */}
          <div className="h-7 w-28 rounded-lg bg-slate-500/30 shimmer-effect mt-2" />

          {/* Footer Subtitle */}
          <div className="h-2.5 w-36 rounded-md bg-slate-500/20 shimmer-effect mt-2" />
        </div>
      ))}
    </div>
  );
};

export const TableRowsShimmer = ({ rows = 7, columns = 9 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-[var(--border-main)] bg-[var(--bg-card)]">
          {/* Column 1: Checkbox / Index */}
          <td className="py-3.5 px-4 text-center">
            <div className="w-4 h-4 rounded bg-slate-500/20 shimmer-effect mx-auto" />
          </td>

          {/* Column 2: User Identity (Avatar + 2 Lines) */}
          <td className="py-3.5 px-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-500/30 shimmer-effect shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-32 rounded bg-slate-500/30 shimmer-effect" />
                <div className="h-2.5 w-24 rounded bg-slate-500/20 shimmer-effect" />
              </div>
            </div>
          </td>

          {/* Column 3: Residency */}
          <td className="py-3.5 px-4">
            <div className="h-5 w-28 rounded-full bg-slate-500/20 shimmer-effect" />
          </td>

          {/* Column 4: KYC Status */}
          <td className="py-3.5 px-4 text-center">
            <div className="h-5 w-20 rounded-full bg-slate-500/20 shimmer-effect mx-auto" />
          </td>

          {/* Column 5: Posts */}
          <td className="py-3.5 px-4 text-center">
            <div className="h-4 w-8 rounded bg-slate-500/20 shimmer-effect mx-auto" />
          </td>

          {/* Column 6: Engagement */}
          <td className="py-3.5 px-4 text-center">
            <div className="h-4 w-32 rounded bg-slate-500/20 shimmer-effect mx-auto" />
          </td>

          {/* Column 7: Score */}
          <td className="py-3.5 px-4 text-center">
            <div className="h-4 w-14 rounded bg-slate-500/30 shimmer-effect mx-auto" />
          </td>

          {/* Column 8: Prize Tier */}
          <td className="py-3.5 px-4 text-center">
            <div className="h-5 w-24 rounded-lg bg-slate-500/20 shimmer-effect mx-auto" />
          </td>

          {/* Column 9: Actions */}
          <td className="py-3.5 px-4 text-right">
            <div className="h-6 w-20 rounded-lg bg-slate-500/20 shimmer-effect ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
};
