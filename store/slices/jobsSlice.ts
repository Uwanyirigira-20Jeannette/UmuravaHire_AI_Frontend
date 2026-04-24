import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Job } from '@/types';

interface JobsState {
  items: Job[];
  selected: Job | null;
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = { items: [], selected: null, loading: false, error: null };

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchJobs = createAsyncThunk('jobs/fetchAll', async (_, { rejectWithValue }) => {
  const res = await fetch('/api/jobs');
  if (!res.ok) return rejectWithValue('Failed to fetch jobs');
  return (await res.json()) as Job[];
});

export const createJob = createAsyncThunk(
  'jobs/create',
  async (data: Omit<Job, '_id' | 'status' | 'applicantCount' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      return rejectWithValue(err.message || 'Failed to create job');
    }
    return (await res.json()) as Job;
  }
);

export const updateJob = createAsyncThunk(
  'jobs/update',
  async ({ id, data }: { id: string; data: Partial<Job> }, { rejectWithValue }) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return rejectWithValue('Failed to update job');
    return (await res.json()) as Job;
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/delete',
  async (id: string, { rejectWithValue }) => {
    const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    if (!res.ok) return rejectWithValue('Failed to delete job');
    return id;
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    selectJob(state, action: PayloadAction<Job | null>) {
      state.selected = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchJobs
    builder
      .addCase(fetchJobs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        // Keep selected job in sync with fresh server data (picks up new applicantCount, status, etc.)
        if (state.selected) {
          const refreshed = action.payload.find((j) => j._id === state.selected!._id);
          if (refreshed) state.selected = refreshed;
        }
      })
      .addCase(fetchJobs.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });

    // createJob
    builder
      .addCase(createJob.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createJob.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.selected = action.payload;
      })
      .addCase(createJob.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });

    // updateJob
    builder
      .addCase(updateJob.fulfilled, (state, action) => {
        const idx = state.items.findIndex((j) => j._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selected?._id === action.payload._id) state.selected = action.payload;
      });

    // deleteJob
    builder
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.items = state.items.filter((j) => j._id !== action.payload);
        if (state.selected?._id === action.payload) state.selected = null;
      });
  },
});

export const { selectJob, clearError } = jobsSlice.actions;
export default jobsSlice.reducer;
