import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminApi } from "../services/api";

export const fetchWinners = createAsyncThunk(
  "admin/fetchWinners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/admin/winners");
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch winners");
    }
  }
);

export const updateKycThunk = createAsyncThunk(
  "admin/updateKyc",
  async ({ winnerId, status, notes }, { rejectWithValue }) => {
    try {
      const response = await adminApi.put(`/admin/kyc/${winnerId}`, { status, notes });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update KYC status");
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    winners: [],
    summary: null,
    weeklyActivity: [],
    allParticipants: [],
    kycAuditLogs: [],
    loading: false,
    error: null,
    lastCascadeNotice: null
  },
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Winners
      .addCase(fetchWinners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWinners.fulfilled, (state, action) => {
        state.loading = false;
        state.winners = action.payload.winners || [];
        state.summary = action.payload.summary || null;
        state.weeklyActivity = action.payload.weeklyActivity || [];
        state.allParticipants = action.payload.allParticipants || [];
        state.kycAuditLogs = action.payload.kycAuditLogs || [];
      })
      .addCase(fetchWinners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update KYC Status
      .addCase(updateKycThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateKycThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.winners = action.payload.recalculatedWinners || state.winners;
        state.summary = action.payload.recalculatedSummary || state.summary;
        if (action.payload.weeklyActivity) state.weeklyActivity = action.payload.weeklyActivity;
        if (action.payload.allParticipants) state.allParticipants = action.payload.allParticipants;
        if (action.payload.kycAuditLogs) state.kycAuditLogs = action.payload.kycAuditLogs;
        state.lastCascadeNotice = `KYC marked ${action.payload.updatedStatus}. Ranking cascade recalculated!`;
      })
      .addCase(updateKycThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
