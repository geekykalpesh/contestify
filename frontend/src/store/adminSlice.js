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

export const fetchPaginatedParticipants = createAsyncThunk(
  "admin/fetchPaginatedParticipants",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/admin/participants/paginated", { params });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch paginated participants");
    }
  }
);

export const fetchAdminStats = createAsyncThunk(
  "admin/fetchAdminStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.get("/admin/stats");
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch admin stats");
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

export const bulkUpdateKycThunk = createAsyncThunk(
  "admin/bulkUpdateKyc",
  async ({ userIds, status, notes }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminApi.put("/admin/users/bulk-kyc", { userIds, status, notes });
      dispatch(fetchWinners());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to bulk update KYC");
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

    // Server-side Paginated Users State (High Scale)
    paginatedUsers: [],
    paginationMeta: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1
    },
    filterParams: {
      page: 1,
      limit: 20,
      search: "",
      residency: "ALL",
      kycStatus: "ALL",
      role: "ALL",
      sortBy: "createdAt",
      sortOrder: "desc"
    },
    selectedUserIds: [],

    // System-wide Aggregated Stats
    stats: {
      totalUsers: 0,
      totalCgEligible: 0,
      totalOutsideCg: 0,
      kycPending: 0,
      kycPassed: 0,
      kycFailed: 0,
      prizesAllocated: 0,
      disqualifiedCount: 0,
      totalPosts: 0
    },

    loading: false,
    participantsLoading: false,
    statsLoading: false,
    bulkLoading: false,
    error: null,
    lastCascadeNotice: null
  },
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    setFilterParams: (state, action) => {
      state.filterParams = { ...state.filterParams, ...action.payload };
    },
    toggleUserSelection: (state, action) => {
      const userId = action.payload;
      if (state.selectedUserIds.includes(userId)) {
        state.selectedUserIds = state.selectedUserIds.filter((id) => id !== userId);
      } else {
        state.selectedUserIds.push(userId);
      }
    },
    selectAllCurrentPageUsers: (state) => {
      const currentPageIds = state.paginatedUsers.map((u) => u.id || u.userId);
      const allSelected = currentPageIds.every((id) => state.selectedUserIds.includes(id));
      if (allSelected) {
        state.selectedUserIds = state.selectedUserIds.filter((id) => !currentPageIds.includes(id));
      } else {
        const newSet = new Set([...state.selectedUserIds, ...currentPageIds]);
        state.selectedUserIds = Array.from(newSet);
      }
    },
    clearUserSelection: (state) => {
      state.selectedUserIds = [];
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

      // Fetch Paginated Participants
      .addCase(fetchPaginatedParticipants.pending, (state) => {
        state.participantsLoading = true;
      })
      .addCase(fetchPaginatedParticipants.fulfilled, (state, action) => {
        state.participantsLoading = false;
        state.paginatedUsers = action.payload.users || [];
        state.paginationMeta = action.payload.pagination || state.paginationMeta;
      })
      .addCase(fetchPaginatedParticipants.rejected, (state, action) => {
        state.participantsLoading = false;
        state.error = action.payload;
      })

      // Fetch Admin Stats
      .addCase(fetchAdminStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload || state.stats;
      })
      .addCase(fetchAdminStats.rejected, (state) => {
        state.statsLoading = false;
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
      })

      // Bulk Update KYC Status
      .addCase(bulkUpdateKycThunk.pending, (state) => {
        state.bulkLoading = true;
      })
      .addCase(bulkUpdateKycThunk.fulfilled, (state) => {
        state.bulkLoading = false;
        state.selectedUserIds = [];
      })
      .addCase(bulkUpdateKycThunk.rejected, (state, action) => {
        state.bulkLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearAdminError,
  setFilterParams,
  toggleUserSelection,
  selectAllCurrentPageUsers,
  clearUserSelection
} = adminSlice.actions;

export default adminSlice.reducer;
