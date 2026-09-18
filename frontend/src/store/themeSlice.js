import { createSlice } from "@reduxjs/toolkit";

const initialTheme = localStorage.getItem("app_theme") || "dark";
document.documentElement.classList.toggle("dark", initialTheme === "dark");

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    mode: initialTheme
  },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "dark" ? "light" : "dark";
      localStorage.setItem("app_theme", state.mode);
      document.documentElement.classList.toggle("dark", state.mode === "dark");
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem("app_theme", state.mode);
      document.documentElement.classList.toggle("dark", state.mode === "dark");
    }
  }
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
