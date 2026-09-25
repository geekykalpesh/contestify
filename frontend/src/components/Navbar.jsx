import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { toggleTheme } from "../store/themeSlice";
import {
  Camera,
  Trophy,
  Sun,
  Moon,
  LogOut,
  LogIn,
  UserPlus,
  User,
  Settings,
  X,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { getMediaUrl } from "../config";
import { GlobalSearchInput } from "./GlobalSearchInput";
import { NotificationDropdown } from "./NotificationDropdown";

export const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === "dark";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = user && (user.role === "admin" || user.email === "admin@gmail.com" || user.email === "admin@creator.com");

  // Close mobile settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-[var(--bg-card)] border-b border-[var(--border-main)] px-3 sm:px-4 py-2.5 sm:py-3 transition-colors duration-200">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Brand Logo - Authentic Instagram Style */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl ig-ring p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-[var(--bg-main)] rounded-[10px] flex items-center justify-center">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-primary)]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="text-3xl font-ig-logo text-[var(--text-primary)] tracking-wide">
              Contestify
            </span>
          </div>
        </Link>

        {/* Global Instagram-Style Search Bar */}
        <div className="flex-1 max-w-[180px] xs:max-w-xs sm:max-w-sm">
          <GlobalSearchInput />
        </div>

        {/* Navigation Links & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Admin Badge Link (Desktop only or icon on mobile) */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                location.pathname === "/admin"
                  ? "bg-slate-500/10 text-[var(--text-primary)] font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Admin Command Center"
            >
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}

          {/* Real-time Notifications Center Bell */}
          {user && <NotificationDropdown />}

          {/* Desktop Light / Dark Mode Toggle */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="hidden sm:flex p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-500/10 transition-colors cursor-pointer"
            title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {mode === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User Profile Avatar & Settings Drawer Trigger */}
          {user ? (
            <div className="relative flex items-center gap-1 sm:gap-2" ref={menuRef}>
              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-500/10 transition-all cursor-pointer"
                title="User Profile & Settings Menu"
              >
                <div className="w-8 h-8 rounded-full ig-ring p-0.5 overflow-hidden shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={getMediaUrl(user.avatarUrl)}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center font-bold text-[var(--text-primary)] text-xs">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                  )}
                </div>
                <div className="hidden md:block text-left pr-1">
                  <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">{user.name}</div>
                </div>
              </button>

              {/* Desktop Logout Button */}
              <button
                onClick={() => dispatch(logout())}
                title="Logout"
                className="hidden sm:flex p-2 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile / Compact User Settings Menu Dropdown */}
              {isMobileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <div
                    className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border shadow-2xl z-50 animate-slideUp overflow-hidden p-2 space-y-1 transition-colors ${
                      isDark ? "bg-[#141414] border-[#2b2b2b] text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-xl"
                    }`}
                  >
                    {/* User Header */}
                    <div className="p-3 rounded-xl bg-slate-500/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full ig-ring p-0.5 overflow-hidden shrink-0">
                        {user.avatarUrl ? (
                          <img src={getMediaUrl(user.avatarUrl)} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm">
                            {user.name ? user.name[0].toUpperCase() : "U"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-xs truncate text-[var(--text-primary)]">{user.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate">@{user.username || user.email?.split("@")[0]}</div>
                      </div>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Settings Option 1: Profile */}
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-sky-400" />
                        <span>View Profile Page</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </Link>

                    {/* Settings Option 2: Theme Switcher */}
                    <div
                      onClick={() => dispatch(toggleTheme())}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors text-xs font-semibold cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                        <span>App Theme: {isDark ? "Dark Mode" : "Light Mode"}</span>
                      </div>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDark ? "bg-amber-500" : "bg-slate-300"}`}>
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isDark ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                    </div>

                    {/* Settings Option 3: Admin Command Center (if admin) */}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors text-xs font-semibold text-amber-500"
                      >
                        <div className="flex items-center gap-2.5">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <span>Admin Command Center</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Settings Option 4: Logout */}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        dispatch(logout());
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-xs font-bold cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Log Out</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-1 border-l border-[var(--border-main)]">
              <Link
                to="/auth?mode=login"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
              <Link
                to="/auth?mode=signup"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold ig-btn-primary rounded-lg shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
