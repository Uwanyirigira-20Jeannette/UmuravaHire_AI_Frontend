import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ScreeningResult, TalentProfile } from '@/types';

export type PopulatedResult = ScreeningResult & { talent?: TalentProfile };

interface ScreeningState {
  results: PopulatedResult[];
  running: boolean;
  runningJobId: string | null;
  error: string | null;
  lastRunJobId: string | null;
  lastScoringMode: string | null;
}

const initialState: ScreeningState = {
  results: [],
  running: false,
  runningJobId: null,
  error: null,
  lastRunJobId: null,
  lastScoringMode: null,
};

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

// ── Thunks ────────────────────────────────────────────────────────────────────

export const runScreening = createAsyncThunk(
  'screening/run',
  async (jobId: string, { rejectWithValue }) => {
    const res = await fetch(`${API}/api/screening/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    if (!res.ok) {
      const err = await res.json();
      return rejectWithValue(err.message || 'Screening failed');
    }
    return (await res.json()) as { results: PopulatedResult[]; jobId: string; scoringMode: string };
  }
);

export const fetchShortlist = createAsyncThunk(
  'screening/fetchShortlist',
  async (jobId: string, { rejectWithValue }) => {
    const res = await fetch(`${API}/api/screening/shortlist/${jobId}`);
    if (!res.ok) return rejectWithValue('Failed to fetch shortlist');
    const data = await res.json();
    return { results: data as (ScreeningResult & { talent: TalentProfile })[], jobId };
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const screeningSlice = createSlice({
  name: 'screening',
  initialState,
  reducers: {
    clearScreening(state) {
      state.results = [];
      state.error = null;
      state.lastScoringMode = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // runScreening
    builder
      .addCase(runScreening.pending, (state, action) => {
        state.running = true;
        state.runningJobId = action.meta.arg;
        state.error = null;
      })
      .addCase(runScreening.fulfilled, (state, action) => {
        state.running = false;
        state.runningJobId = null;
        state.results = action.payload.results;
        state.lastRunJobId = action.payload.jobId;
        state.lastScoringMode = action.payload.scoringMode ?? 'ai';
      })
      .addCase(runScreening.rejected, (state, action) => {
        state.running = false;
        state.runningJobId = null;
        state.error = action.payload as string;
      });

    // fetchShortlist
    builder
      .addCase(fetchShortlist.pending, (state) => { state.error = null; })
      .addCase(fetchShortlist.fulfilled, (state, action) => {
        state.results = action.payload.results;
        state.lastRunJobId = action.payload.jobId;
      })
      .addCase(fetchShortlist.rejected, (state, action) => { state.error = action.payload as string; });
  },
});

export const { clearScreening, clearError } = screeningSlice.actions;
export default screeningSlice.reducer;
