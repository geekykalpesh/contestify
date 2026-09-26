import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userApi } from "../services/api";
import { USER_SERVICE_URL } from "../config";

export const fetchFeed = createAsyncThunk(
  "feed/fetchFeed",
  async ({ category, page = 1, includeSeen = false } = {}, { rejectWithValue }) => {
    try {
      const response = await userApi.get("/posts/feed", {
        params: { category, page, limit: 10, includeSeen }
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch feed");
    }
  }
);

export const likePostThunk = createAsyncThunk(
  "feed/likePost",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await userApi.post(`/posts/${postId}/like`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to like post");
    }
  }
);

export const commentPostThunk = createAsyncThunk(
  "feed/commentPost",
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const response = await userApi.post(`/posts/${postId}/comment`, { text });
      return { postId, ...response.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add comment");
    }
  }
);

export const deleteCommentThunk = createAsyncThunk(
  "feed/deleteComment",
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      const response = await userApi.delete(`/posts/comments/${commentId}`);
      return { postId, commentId, ...response.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete comment");
    }
  }
);

export const flushViewBuffer = createAsyncThunk(
  "feed/flushViewBuffer",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { viewBuffer } = getState().feed;
      if (!viewBuffer || viewBuffer.length === 0) return;

      const idsToFlush = [...viewBuffer];
      const token = localStorage.getItem("auth_token");

      // Use fetch with keepalive: true to guarantee completion even during page refresh / unload!
      await fetch(`${USER_SERVICE_URL}/api/posts/batch-view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ postIds: idsToFlush }),
        keepalive: true
      });

      return idsToFlush;
    } catch (err) {
      return rejectWithValue("Failed to log views");
    }
  }
);

export const resetSeenReelsThunk = createAsyncThunk(
  "feed/resetSeenReels",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await userApi.post("/posts/reset-seen");
      dispatch(fetchFeed());
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to reset reel history");
    }
  }
);

const feedSlice = createSlice({
  name: "feed",
  initialState: {
    posts: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1, hasMore: false },
    meta: { caughtUp: false, totalViewed: 0, totalAllPosts: 0 },
    selectedCategory: "ALL",
    includeSeen: false,
    viewBuffer: [],
    globalAudioMuted: true,
    loading: false,
    loadingMore: false,
    error: null
  },
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setGlobalMuted: (state, action) => {
      state.globalAudioMuted = action.payload;
    },
    toggleIncludeSeen: (state) => {
      state.includeSeen = !state.includeSeen;
    },
    bufferPostView: (state, action) => {
      const postId = action.payload;
      if (!state.viewBuffer.includes(postId)) {
        state.viewBuffer.push(postId);
      }
    },
    // Real-time socket event updates
    updatePostRealtime: (state, action) => {
      const { postId, likeCount, commentCount, viewCount, score } = action.payload;
      const index = state.posts.findIndex((p) => p._id === postId);
      if (index !== -1) {
        state.posts[index].likeCount = likeCount;
        state.posts[index].commentCount = commentCount;
        state.posts[index].viewCount = viewCount;
        state.posts[index].score = score;
      }
    },
    updateUserAvatarRealtime: (state, action) => {
      const { userId, avatarUrl } = action.payload;
      if (!userId) return;
      state.posts.forEach((post) => {
        if (post.userId) {
          if (typeof post.userId === "object" && (post.userId._id === userId || post.userId.id === userId)) {
            post.userId.avatarUrl = avatarUrl;
          }
        }
      });
    },
    // Optimistic Like / Unlike Toggle
    optimisticLike: (state, action) => {
      const postId = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (post) {
        if (post.hasLiked) {
          post.hasLiked = false;
          post.likeCount = Math.max(0, post.likeCount - 1);
        } else {
          post.hasLiked = true;
          post.likeCount += 1;
        }
        post.score = Number((post.likeCount * 1.0 + post.commentCount * 3.0 + post.viewCount * 0.2).toFixed(2));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Feed
      .addCase(fetchFeed.pending, (state, action) => {
        if (action.meta.arg?.append || (action.meta.arg?.page && action.meta.arg.page > 1)) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const isAppend = action.meta.arg?.append || (action.meta.arg?.page && action.meta.arg.page > 1);

        if (isAppend) {
          const newPosts = action.payload.posts || [];
          const existingIds = new Set(state.posts.map((p) => p._id));
          const filteredNew = newPosts.filter((p) => !existingIds.has(p._id));
          state.posts = [...state.posts, ...filteredNew];
        } else {
          state.posts = action.payload.posts || [];
        }

        const pag = action.payload.pagination || {};
        state.pagination = {
          ...pag,
          hasMore: (pag.page || 1) < (pag.totalPages || 1)
        };
        state.meta = action.payload.meta || {};
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })
      // Like Post Toggle Response Sync
      .addCase(likePostThunk.fulfilled, (state, action) => {
        const { postId, likeCount, hasLiked, score } = action.payload || {};
        const post = state.posts.find((p) => p._id === postId);
        if (post) {
          if (likeCount !== undefined) post.likeCount = likeCount;
          if (hasLiked !== undefined) post.hasLiked = hasLiked;
          if (score !== undefined) post.score = score;
        }
      })
      // Comment Post Response Sync
      .addCase(commentPostThunk.fulfilled, (state, action) => {
        const { postId, commentCount, score } = action.payload || {};
        const post = state.posts.find((p) => p._id === postId);
        if (post) {
          if (commentCount !== undefined) post.commentCount = commentCount;
          if (score !== undefined) post.score = score;
        }
      })
      // Delete Comment Response Sync
      .addCase(deleteCommentThunk.fulfilled, (state, action) => {
        const { postId, commentCount, score } = action.payload || {};
        const post = state.posts.find((p) => p._id === postId);
        if (post) {
          if (commentCount !== undefined) post.commentCount = commentCount;
          if (score !== undefined) post.score = score;
        }
      })
      // Flush View Buffer
      .addCase(flushViewBuffer.fulfilled, (state, action) => {
        if (action.payload) {
          state.viewBuffer = state.viewBuffer.filter((id) => !action.payload.includes(id));
        }
      });
  }
});

export const {
  setSelectedCategory,
  setGlobalMuted,
  toggleIncludeSeen,
  bufferPostView,
  updatePostRealtime,
  updateUserAvatarRealtime,
  optimisticLike
} = feedSlice.actions;

export default feedSlice.reducer;
