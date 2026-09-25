import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Bell, Heart, MessageSquare, UserPlus, Trophy, ShieldCheck, Check, Sparkles } from "lucide-react";
import { userApi } from "../services/api";
import { socket } from "../services/socket";
import { useToast } from "../context/ToastContext";
import { getMediaUrl } from "../config";

export const NotificationDropdown = () => {
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === "dark";
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

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

  // Fetch notifications on mount & user change
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Real-time Socket Event Listener
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

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
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
      toast.success("All notifications marked as read", "Notifications Cleared");
    } catch (err) {
      console.error("Failed to mark notifications read", err);
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case "LIKE":
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case "COMMENT":
        return <MessageSquare className="w-4 h-4 text-sky-500 fill-sky-500" />;
      case "FOLLOW":
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case "CONTEST_RANK":
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case "KYC_UPDATE":
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-sky-400" />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navbar Bell Button */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) fetchNotifications();
        }}
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-500/10 transition-colors relative cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-[var(--bg-card)] shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown / Mobile Modal Menu */}
      {isOpen && (
        <div
          className={`fixed sm:absolute inset-x-3 sm:inset-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 max-h-[82vh] sm:max-h-[80vh] flex flex-col rounded-2xl border shadow-2xl z-50 animate-slideUp overflow-hidden transition-colors ${
            isDark ? "bg-[#121212] border-[#2b2b2b] text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-2xl"
          }`}
        >
          {/* Header */}
          <div className={`p-3.5 border-b flex items-center justify-between shrink-0 ${
            isDark ? "border-[#272727] bg-[#0f0f0f]" : "border-slate-200 bg-white"
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-10">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-12">
                No notifications yet. Activity on your reels will appear here!
              </div>
            ) : (
              notifications.map((n) => {
                const senderName = n.senderId?.name || (n.senderId?.username ? `@${n.senderId.username}` : "Contestify");
                return (
                  <div
                    key={n._id}
                    onClick={() => !n.read && handleMarkSingleRead(n._id)}
                    className={`p-2.5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer group relative ${
                      !n.read
                        ? isDark
                          ? "bg-slate-800/50 hover:bg-slate-800"
                          : "bg-sky-50/70 hover:bg-sky-50"
                        : isDark
                        ? "hover:bg-slate-900"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Icon / Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      {n.senderId?.avatarUrl ? (
                        <img
                          src={getMediaUrl(n.senderId.avatarUrl)}
                          alt={senderName}
                          className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-300 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                          {senderName[0].toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white dark:bg-slate-900 shadow">
                        {getNotificationIcon(n.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed">
                        <span className="font-bold text-slate-900 dark:text-slate-100 mr-1">{senderName}</span>
                        <span className="text-slate-700 dark:text-slate-300">{n.message}</span>
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block font-medium">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Unread indicator dot */}
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0 self-center" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className={`p-2.5 border-t text-center text-[10px] text-slate-500 font-medium ${
            isDark ? "border-[#272727] bg-[#0f0f0f]" : "border-slate-200 bg-slate-50"
          }`}>
            Real-time notifications enabled ⚡
          </div>
        </div>
      )}
    </div>
  );
};
