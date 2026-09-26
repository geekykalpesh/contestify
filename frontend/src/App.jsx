import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { ToastProvider } from "./context/ToastContext";
import { Navbar } from "./components/Navbar";
import { FeedPage } from "./pages/FeedPage";
import { AuthPage } from "./pages/AuthPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminDashboard } from "./pages/AdminDashboard";

import { useSelector, useDispatch } from "react-redux";
import { socket } from "./services/socket";
import { updateUserRealtime } from "./store/authSlice";
import { updateUserAvatarRealtime } from "./store/feedSlice";

const GlobalSocketListener = ({ children }) => {
  const dispatch = useDispatch();

  React.useEffect(() => {
    const handleUserUpdated = (data) => {
      if (data && data.userId !== undefined) {
        dispatch(updateUserRealtime(data));
        dispatch(updateUserAvatarRealtime(data));
      }
    };

    socket.on("user_updated", handleUserUpdated);
    return () => {
      socket.off("user_updated", handleUserUpdated);
    };
  }, [dispatch]);

  return children;
};

const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) {
    return <Navigate to="/auth?mode=signup" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }
  const isAdmin = user.role === "admin" || user.email === "admin@gmail.com" || user.email === "admin@creator.com";
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export function App() {
  React.useEffect(() => {
    const preventDefault = (e) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  return (
    <Provider store={store}>
      <ToastProvider>
        <GlobalSocketListener>
          <BrowserRouter>
          <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col transition-colors duration-200">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <FeedPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:identifier"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/auth?mode=signup" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </GlobalSocketListener>
    </ToastProvider>
    </Provider>
  );
}

export default App;
