import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Bell, Heart, MessageSquare, UserPlus, Trophy, ShieldCheck,
  Check, Sparkles, X, Trash2, Filter
} from "lucide-react";
import { userApi } from "../services/api";
import { socket } from "../services/socket";
import { useToast } from "../context/ToastContext";
import { getMediaUrl } from "../config";

const FILTER_TABS = [
  { key: "ALL", label: "All" },
  { key: "LIKE", label: "Likes" },
  { key: "COMMENT", label: "Comments" },
  { key: "FOLLOW", label: "Follows" },
  { key: "CONTEST_RANK", label: "Awards" },
];

const NotificationSkeleton = ({ isDark }) => (
  <div className={`p-3 rounded-xl flex items-start gap-3 animate-pulse ${isDark ? "bg-slate-800/40" : "bg-slate-100/80"}`}>
    <div className={`w-9 h-9 rounded-full shrink-0 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
    <div className="flex-1 space-y-2 pt-1">
      <div className={`h-3 rounded-full w-3/4 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
      <div className={`h-2.5 rounded-full w-1/2 ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
    </div>
  </div>
);

export const NotificationDropdown = () => {
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === "dark";
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch on mount & user change
  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // Real-time Socket listener
  useEffect(() => {
    if (!user) return;

    const handleNewNotification = (data) => {
      const { recipientId, notification } = data;
      const currentUserId = user._id || user.id;
      if (recipientId && currentUserId && recipientId.toString() === currentUserId.toString()) {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.info(notification.message || "New Notification!", "Activity Alert");
      }
    };

    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [user, toast]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await userApi.get("/notifications");
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await userApi.post("/notifications/mark-read", {});
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const handleMarkSingleRead = async (notificationId) => {
    try {
      await userApi.post("/notifications/mark-read", { notificationId });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleDeleteNotification = async (e, notificationId, wasUnread) => {
    e.stopPropagation();
    setDeletingId(notificationId);
    try {
      const res = await userApi.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (wasUnread) setUnreadCount(res.data.data.unreadCount ?? Math.max(0, unreadCount - 1));
    } catch (err) {
      toast.error("Failed to delete notification", "Error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    setClearingAll(true);
    try {
      await userApi.delete("/notifications/clear-all");
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications cleared!", "Inbox Empty");
    } catch (err) {
      toast.error("Failed to clear notifications", "Error");
    } finally {
      setClearingAll(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "LIKE":         return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      case "COMMENT":      return <MessageSquare className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />;
      case "FOLLOW":       return <UserPlus className="w-3.5 h-3.5 text-emerald-500" />;
      case "CONTEST_RANK": return <Trophy className="w-3.5 h-3.5 text-amber-500" />;
      case "KYC_UPDATE":   return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      default:             return <Sparkles className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "LIKE":         return isDark ? "bg-rose-500/20 border-rose-500/30"    : "bg-rose-50 border-rose-200";
      case "COMMENT":      return isDark ? "bg-sky-500/20 border-sky-500/30"      : "bg-sky-50 border-sky-200";
      case "FOLLOW":       return isDark ? "bg-emerald-500/20 border-emerald-500/30" : "bg-emerald-50 border-emerald-200";
      case "CONTEST_RANK": return isDark ? "bg-amber-500/20 border-amber-500/30"  : "bg-amber-50 border-amber-200";
      default:             return isDark ? "bg-slate-700/60 border-slate-600"     : "bg-slate-50 border-slate-200";
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60)  return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)  return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)    return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Filter logic
  const filteredNotifications = activeFilter === "ALL"
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  const unreadFiltered = filteredNotifications.filter((n) => !n.read).length;

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) fetchNotifications();
        }}
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-500/10 transition-colors relative cursor-pointer"
        title="Notifications"
        id="notification-bell-btn"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-[var(--bg-card)] shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`fixed sm:absolute inset-x-3 sm:inset-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-[380px] max-h-[85vh] sm:max-h-[78vh] flex flex-col rounded-2xl border shadow-2xl z-50 overflow-hidden transition-colors ${
            isDark
              ? "bg-[#141414] border-slate-800 text-slate-100 shadow-black/70"
              : "bg-white border-slate-200 text-slate-900 shadow-xl"
          }`}
          style={{ animation: "slideUp 0.18s ease-out" }}
        >
          {/* ── Header ── */}
          <div className={`px-3.5 pt-3.5 pb-2 border-b shrink-0 space-y-3 ${
            isDark ? "border-slate-800 bg-[#1a1a1a]" : "border-slate-100 bg-slate-50/80"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/20">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg hover:bg-sky-500/10 transition-colors"
                    title="Mark all as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    disabled={clearingAll}
                    className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg transition-colors ${
                      isDark
                        ? "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        : "text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                    }`}
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{clearingAll ? "Clearing..." : "Clear all"}</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg cursor-pointer sm:hidden ${
                    isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Filter Tabs ── */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
              {FILTER_TABS.map((tab) => {
                const tabCount = tab.key === "ALL"
                  ? notifications.length
                  : notifications.filter((n) => n.type === tab.key).length;
                const isActive = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? isDark
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                        : isDark
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tabCount > 0 && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[16px] text-center ${
                        isActive
                          ? "bg-sky-500/30 text-sky-400"
                          : isDark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"
                      }`}>
                        {tabCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Notification List ── */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
            {loading ? (
              <div className="space-y-1.5 p-1">
                {[1, 2, 3, 4].map((i) => (
                  <NotificationSkeleton key={i} isDark={isDark} />
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <Bell className={`w-6 h-6 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                </div>
                <p className={`text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {activeFilter === "ALL" ? "No notifications yet" : `No ${FILTER_TABS.find(t => t.key === activeFilter)?.label?.toLowerCase()} yet`}
                </p>
                <p className={`text-[10px] text-center max-w-[180px] ${isDark ? "text-slate-600" : "text-slate-300"}`}>
                  Activity on your reels will appear here in real-time
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const senderName = n.senderId?.name
                  || (n.senderId?.username ? `@${n.senderId.username}` : "Contestify");
                const isDeleting = deletingId === n._id;

                return (
                  <div
                    key={n._id}
                    onClick={() => !n.read && handleMarkSingleRead(n._id)}
                    className={`p-3 rounded-xl flex items-start gap-3 transition-all cursor-pointer group relative ${
                      isDeleting ? "opacity-40 scale-95" : "opacity-100"
                    } ${
                      !n.read
                        ? isDark
                          ? "bg-sky-500/8 hover:bg-sky-500/12 border border-sky-500/15"
                          : "bg-sky-50/80 hover:bg-sky-50 border border-sky-100"
                        : isDark
                        ? "hover:bg-slate-800/60 border border-transparent"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                    style={{ transition: "all 0.15s ease" }}
                  >
                    {/* Avatar + Icon Badge */}
                    <div className="relative shrink-0">
                      {n.senderId?.avatarUrl ? (
                        <img
                          src={getMediaUrl(n.senderId.avatarUrl)}
                          alt={senderName}
                          className={`w-9 h-9 rounded-full object-cover border ${
                            isDark ? "border-slate-700" : "border-slate-200"
                          }`}
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                          isDark ? "bg-slate-800 text-slate-100 border-slate-700" : "bg-sky-100 text-sky-800 border-sky-200"
                        }`}>
                          {senderName[0]?.toUpperCase() || "C"}
                        </div>
                      )}
                      {/* Type icon badge */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                        isDark ? "border-slate-900 bg-slate-900" : "border-white bg-white"
                      } ${getIconBg(n.type)}`}>
                        {getNotificationIcon(n.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-xs leading-snug">
                        <span className={`font-bold mr-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                          {senderName}
                        </span>
                        <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                          {n.message}
                        </span>
                      </p>
                      <span className={`text-[10px] mt-0.5 block font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Right side: unread dot + delete */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0 self-center">
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-sky-500" />
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(e, n._id, !n.read)}
                        disabled={isDeleting}
                        className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                          isDark
                            ? "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                            : "text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                        }`}
                        title="Delete notification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Footer ── */}
          <div className={`px-3.5 py-2.5 border-t flex items-center justify-between shrink-0 ${
            isDark ? "border-slate-800 bg-[#101010]" : "border-slate-100 bg-slate-50"
          }`}>
            <span className={`text-[10px] font-semibold flex items-center gap-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Real-time notifications active
            </span>
            {filteredNotifications.length > 0 && (
              <span className={`text-[10px] font-medium ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                {filteredNotifications.length} {filteredNotifications.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
