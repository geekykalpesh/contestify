import React from "react";
import { Shield, Clock, CheckCircle2, XCircle } from "lucide-react";

export const AdminAuditLogsTable = ({ auditLogs = [] }) => {
  return (
    <div className="ig-card rounded-2xl overflow-hidden shadow-lg border border-[var(--border-main)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-main)] bg-slate-500/5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-[var(--text-primary)] text-base">
            KYC Audit Trail & Decision Log (PostgreSQL Persisted)
          </h3>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
          Immutable history of manual KYC pass / fail actions and ranking cascade triggers.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-main)] bg-slate-500/10 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Target User</th>
              <th className="py-3 px-4 text-center">Previous State</th>
              <th className="py-3 px-4 text-center">New State</th>
              <th className="py-3 px-4">Audit Notes / Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-main)] text-xs font-mono">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => {
                const isPass = log.newStatus === "PASSED";
                const isFail = log.newStatus === "FAILED";

                return (
                  <tr key={log.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="py-3 px-4 text-[var(--text-secondary)] text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[var(--text-primary)] font-semibold font-sans">
                      {log.userEmail}
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-500/10 text-[var(--text-muted)] text-[10px] font-bold">
                        {log.previousStatus || "PENDING"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      {isPass ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> PASSED
                        </span>
                      ) : isFail ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> FAILED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                          {log.newStatus}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[var(--text-secondary)] font-sans italic text-[11px]">
                      {log.notes || "No notes attached."}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
                  No KYC audit log records in PostgreSQL DB yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
