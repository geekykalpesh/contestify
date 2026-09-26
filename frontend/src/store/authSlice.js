import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userApi } from "../services/api";

const tokenFromStorage = localStorage.getItem("auth_token");
const userFromStorage = localStorage.getItem("auth_user")
  ? JSON.parse(localStorage.getItem("auth_user"))
  : null;

export const signupUser = createAsyncThunk(
  "auth/signup",
  async (payload, { rejectWithValue }) => {
    try {
      let config = {};
      let body = payload;

      // Handle FormData if avatar file is attached
      if (payload instanceof FormData) {
        config = { headers: { "Content-Type": "multipart/form-data" } };
      }

      const response = await userApi.post("/auth/signup", body, config);
      const email = payload instanceof FormData ? payload.get("email") : payload.email;
      return { email, user: response.data.data.user };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Signup failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await userApi.post("/auth/login", payload);
      const { token, user } = response.data.data;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      return { token, user };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const updateResidencyStatus = createAsyncThunk(
  "auth/updateResidency",
  async (residency, { rejectWithValue }) => {
    try {
      const response = await userApi.put("/auth/residency", { residency });
      const updatedUser = response.data.data;
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update residency");
    }
  }
);

export const updateAvatarThunk = createAsyncThunk(
  "auth/updateAvatar",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await userApi.put("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const updatedUser = response.data.data;
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update profile picture");
    }
  }
);

export const deleteAvatarThunk = createAsyncThunk(
  "auth/deleteAvatar",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.delete("/auth/avatar");
      const updatedUser = response.data.data;
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to remove profile picture");
    }
  }
);

export const updateKycThunkUser = createAsyncThunk(
  "auth/updateKyc",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await userApi.put("/auth/kyc", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const updatedUser = response.data.data;
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update KYC details");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: tokenFromStorage,
    user: userFromStorage,
    loading: false,
    error: null,
    signupSuccess: false,
    signupEmail: ""
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      state.token = null;
      state.user = null;
      state.error = null;
      state.signupSuccess = false;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    clearSignupSuccess: (state) => {
      state.signupSuccess = false;
    },
    updateUserRealtime: (state, action) => {
      if (state.user && (state.user._id === action.payload.userId || state.user.id === action.payload.userId)) {
        state.user.avatarUrl = action.payload.avatarUrl;
        localStorage.setItem("auth_user", JSON.stringify(state.user));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.signupSuccess = false;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.signupSuccess = true;
        state.signupEmail = action.payload.email;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.signupSuccess = false;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.signupSuccess = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Residency
      .addCase(updateResidencyStatus.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Avatar
      .addCase(updateAvatarThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(deleteAvatarThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // KYC
      .addCase(updateKycThunkUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  }
});

export const { logout, clearAuthError, clearSignupSuccess, updateUserRealtime } = authSlice.actions;
export default authSlice.reducer;
