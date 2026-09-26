import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userApi } from '../../services/api';

export interface Post {
  _id: string;
  userId: any;
  caption?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType?: 'video' | 'image';
  isVideo?: boolean;
  category?: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  hasLiked?: boolean;
  createdAt?: string;
}

interface FeedState {
  posts: Post[];
  activePostId: string | null;
  selectedCategory: string;
  page: number;
  hasMore: boolean;
  loading: boolean;
  refreshing: boolean;
  isFallback: boolean;
  isMuted: boolean;
  error: string | null;
}

const initialState: FeedState = {
  posts: [],
  activePostId: null,
  selectedCategory: 'ALL',
  page: 1,
  hasMore: true,
  loading: false,
  refreshing: false,
  isFallback: false,
  isMuted: false,
  error: null,
};

export const fetchFeedPosts = createAsyncThunk(
  'feed/fetchFeedPosts',
  async (
    { page, category, append }: { page: number; category: string; append: boolean },
    { rejectWithValue }
  ) => {
    try {
      const categoryParam = category === 'ALL' ? undefined : category;
      const res = await userApi.get('/posts/feed', {
        params: { category: categoryParam, page, limit: 10 },
      });
      return {
        posts: res.data.data.posts || [],
        pagination: res.data.data.pagination || {},
        meta: res.data.data.meta || {},
        append,
        page,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch feed');
    }
  }
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
      state.posts = [];
      state.page = 1;
      state.hasMore = true;
      state.activePostId = null;
    },
    setActivePostId: (state, action: PayloadAction<string | null>) => {
      state.activePostId = action.payload;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    optimisticToggleLike: (state, action: PayloadAction<string>) => {
      const post = state.posts.find((p) => p._id === action.payload);
      if (post) {
        post.hasLiked = !post.hasLiked;
        post.likeCount = post.hasLiked
          ? post.likeCount + 1
          : Math.max(0, post.likeCount - 1);
      }
    },
    updatePostStats: (
      state,
      action: PayloadAction<{ postId: string; likeCount?: number; commentCount?: number; viewCount?: number }>
    ) => {
      const post = state.posts.find((p) => p._id === action.payload.postId);
      if (post) {
        if (action.payload.likeCount !== undefined) post.likeCount = action.payload.likeCount;
        if (action.payload.commentCount !== undefined) post.commentCount = action.payload.commentCount;
        if (action.payload.viewCount !== undefined) post.viewCount = action.payload.viewCount;
      }
    },
    incrementCommentCount: (state, action: PayloadAction<string>) => {
      const post = state.posts.find((p) => p._id === action.payload);
      if (post) {
        post.commentCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedPosts.pending, (state, action) => {
        if (!action.meta.arg.append) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchFeedPosts.fulfilled, (state, action) => {
        const { posts, pagination, meta, append, page } = action.payload;
        state.loading = false;
        state.refreshing = false;
        state.isFallback = meta.isFallback || false;
        state.page = page;
        state.hasMore = pagination.page < pagination.totalPages;

        if (append) {
          const existingIds = new Set(state.posts.map((p) => p._id));
          const newUnique = posts.filter((p: Post) => !existingIds.has(p._id));
          state.posts = [...state.posts, ...newUnique];
        } else {
          state.posts = posts;
          if (posts.length > 0) {
            state.activePostId = posts[0]._id;
          } else {
            state.activePostId = null;
          }
        }
      })
      .addCase(fetchFeedPosts.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = (action.payload as string) || 'Failed to load posts';
      });
  },
});

export const {
  setSelectedCategory,
  setActivePostId,
  toggleMute,
  optimisticToggleLike,
  updatePostStats,
  incrementCommentCount,
} = feedSlice.actions;

export default feedSlice.reducer;
