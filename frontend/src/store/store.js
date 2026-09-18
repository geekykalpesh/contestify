import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import feedReducer from "./feedSlice";
import adminReducer from "./adminSlice";
import themeReducer from "./themeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
    admin: adminReducer,
    theme: themeReducer
  }
});
