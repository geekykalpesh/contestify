import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { toggleTheme } from "../store/themeSlice";
import { Camera, Film, Trophy, Sun, Moon, LogOut, LogIn, UserPlus } from "lucide-react";
import { getMediaUrl } from "../config";

export const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);

  const isAdmin = user && (user.role === "admin" || user.email === "admin@gmail.com" || user.email === "admin@creator.com");

  return (
    <nav className="sticky top-0 z-40 bg-[var(--bg-card)] border-b border-[var(--border-main)] px-4 py-3 transition-colors duration-200">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand Logo - Authentic Instagram Style */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl ig-ring p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-[var(--bg-main)] rounded-[10px] flex items-center justify-center">
              <Camera className="w-5 h-5 text-[var(--text-primary)]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-3xl font-ig-logo text-[var(--text-primary)] tracking-wide">
              Contestify
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              location.pathname === "/"
                ? "bg-slate-500/10 text-[var(--text-primary)] font-bold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Film className="w-4 h-4" />
            <span className="hidden sm:inline">Feed</span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                location.pathname === "/admin"
                  ? "bg-slate-500/10 text-[var(--text-primary)] font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-500/10 transition-colors"
            title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {mode === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-[var(--border-main)]">
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
                <div className="w-8 h-8 rounded-full ig-ring p-0.5 overflow-hidden">
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
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">{user.name}</div>
                </div>
              </Link>

              <button
                onClick={() => dispatch(logout())}
                title="Logout"
                className="p-2 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-main)]">
              <Link
                to="/auth?mode=login"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
              <Link
                to="/auth?mode=signup"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ig-btn-primary rounded-lg shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
