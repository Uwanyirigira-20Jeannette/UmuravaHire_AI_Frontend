'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchJobs } from '@/store/slices/jobsSlice';
import { runScreening, fetchShortlist, clearError } from '@/store/slices/screeningSlice';
import type { PopulatedResult } from '@/store/slices/screeningSlice';
import type { Job } from '@/types';
import Link from 'next/link';
import {
  AlertCircle, CheckCircle2, Loader2, Users, Brain, ArrowRight,
  ChevronDown, ChevronUp, Download, RefreshCw, Trophy, Star,
  Zap, BookOpen, TrendingUp, MapPin, Briefcase, Info, Search,
} from 'lucide-react';

/* ─── Scoring criteria metadata ───────────────────────────────────── */
const CRITERIA = [
  { key: 'skills'     as const, label: 'Skills Match',         icon: Zap,       color: 'bg-[#0f172a]'  },
  { key: 'experience' as const, label: 'Experience Relevance', icon: Briefcase,  color: 'bg-blue-600'   },
  { key: 'education'  as const, label: 'Education Fit',        icon: BookOpen,   color: 'bg-indigo-500' },
  { key: 'relevance'  as const, label: 'Overall Relevance',    icon: TrendingUp, color: 'bg-violet-500' },
];

const DEFAULT_WEIGHTS = { skills: 35, experience: 30, education: 20, relevance: 15 };

/* ─── Helpers ─────────────────────────────────────────────────────── */
function scoreColor(n: number) {
  if (n >= 85) return 'text-emerald-600';
  if (n >= 70) return 'text-blue-600';
  if (n >= 50) return 'text-amber-600';
  return 'text-red-500';
}
function scoreBg(n: number) {
  if (n >= 85) return 'bg-emerald-500';
  if (n >= 70) return 'bg-blue-500';
  if (n >= 50) return 'bg-amber-500';
  return 'bg-red-400';
}
function fitMeta(suggestion: string): { label: string; cls: string } {
  if (suggestion === 'Strong Yes') return { label: 'HIGH MATCH',  cls: 'fit-high-match' };
  if (suggestion === 'Yes')        return { label: 'STRONG FIT',  cls: 'fit-strong-fit' };
  if (suggestion === 'Maybe')      return { label: 'GOOD FIT',    cls: 'fit-good-fit'   };
  return                                  { label: 'LOW FIT',     cls: 'fit-low-fit'    };
}
function rankBadge(rank: number) {
  if (rank === 1) return 'bg-amber-400 text-white';
  if (rank === 2) return 'bg-[#b0bec5] text-white';
  if (rank === 3) return 'bg-[#cd7f32] text-white';
  return 'bg-[#f2f4f6] text-[#45464d]';
}

/* ─── Export CSV ──────────────────────────────────────────────────── */
function exportCSV(results: PopulatedResult[], jobTitle: string) {
  const rows = [
    ['Rank', 'Name', 'Email', 'Current Role', 'Location', 'Match Score',
     'Skills', 'Experience', 'Education', 'Relevance',
     'Fit', 'Hiring Suggestion', 'Strengths', 'Gaps', 'Recommendation'],
    ...results.map((r) => {
      const t = r.talent;
      return [
        r.rank,
        t?.name ?? '',
        t?.email ?? '',
        t?.currentRole ?? '',
        t?.location ?? '',
        r.matchScore,
        r.scoreBreakdown.skills,
        r.scoreBreakdown.experience,
        r.scoreBreakdown.education,
        r.scoreBreakdown.relevance,
        fitMeta(r.hiringSuggestion).label,
        r.hiringSuggestion,
        (r.strengths ?? []).join(' | '),
        (r.gaps ?? []).join(' | '),
        r.recommendation ?? '',
      ];
    }),
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `shortlist-${jobTitle.replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Candidate row ───────────────────────────────────────────────── */
function CandidateRow({
  result, rank, expanded, onToggle, weights,
}: {
  result: PopulatedResult;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
  weights: typeof DEFAULT_WEIGHTS;
}) {
  const t   = result.talent;
  const fit = fitMeta(result.hiringSuggestion);
  const displayName = t?.name || [t?.firstName, t?.lastName].filter(Boolean).join(' ') || 'Unknown';

  return (
    <div className={`border border-[#e6e8ea] rounded-lg overflow-hidden transition-shadow ${expanded ? 'shadow-md' : 'hover:shadow-sm'}`}>
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-[#f7f9fb] transition-colors text-left"
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${rankBadge(rank)}`}>
          {rank <= 3 ? <Trophy className="w-3 h-3" /> : rank}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#191c1e] text-[14px] leading-tight truncate">{displayName}</p>
          <p className="text-[11px] text-[#76777d] truncate flex items-center gap-1 mt-0.5">
            {t?.currentRole && <><Briefcase className="w-3 h-3 flex-shrink-0" />{t.currentRole}</>}
            {t?.location && t.location !== 'Not specified' && <><MapPin className="w-3 h-3 ml-1.5 flex-shrink-0" />{t.location}</>}
          </p>
        </div>

        <div className="flex flex-col items-center flex-shrink-0 w-14">
          <span className={`text-2xl font-black leading-none ${scoreColor(result.matchScore)}`}>
            {Math.round(result.matchScore)}
          </span>
          <span className="text-[9px] text-[#76777d] uppercase tracking-wide mt-0.5">score</span>
        </div>

        <span className={`${fit.cls} hidden sm:block flex-shrink-0`}>{fit.label}</span>

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 hidden md:block ${
          result.hiringSuggestion === 'Strong Yes' ? 'bg-emerald-100 text-emerald-700' :
          result.hiringSuggestion === 'Yes'        ? 'bg-blue-100 text-blue-700' :
          result.hiringSuggestion === 'Maybe'      ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-600'
        }`}>
          {result.hiringSuggestion}
        </span>

        {expanded ? <ChevronUp className="w-4 h-4 text-[#76777d] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#76777d] flex-shrink-0" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="bg-[#f7f9fb] border-t border-[#e6e8ea] px-4 py-5">
          <div className="grid lg:grid-cols-[1fr_1fr_1fr] gap-5">

            {/* Score breakdown */}
            <div>
              <p className="section-label mb-3">Score Breakdown</p>
              <div className="space-y-3">
                {CRITERIA.map((c) => {
                  const val = result.scoreBreakdown[c.key] ?? 0;
                  const w   = weights[c.key];
                  return (
                    <div key={c.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-[#45464d]">{c.label}</span>
                        <span className="text-[12px] font-black text-[#191c1e]">{Math.round(val)}</span>
                      </div>
                      <div className="h-1.5 bg-[#e6e8ea] rounded-full overflow-hidden">
                        <div className={`h-full ${scoreBg(val)} rounded-full transition-all`} style={{ width: `${val}%` }} />
                      </div>
                      <p className="text-[10px] text-[#76777d] mt-0.5">Weight: {w}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths + Gaps */}
            <div>
              <p className="section-label mb-3">Key Strengths</p>
              <ul className="space-y-2">
                {(result.strengths ?? []).slice(0, 5).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#191c1e]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
                {(!result.strengths || result.strengths.length === 0) && (
                  <li className="text-sm text-[#76777d] italic">No strengths listed</li>
                )}
              </ul>

              {(result.gaps ?? []).length > 0 && (
                <>
                  <p className="section-label mb-2 mt-4">Identified Gaps</p>
                  <ul className="space-y-2">
                    {result.gaps.slice(0, 4).map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#45464d]">
                        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* AI Recommendation + meta */}
            <div>
              <p className="section-label mb-3">AI Recommendation</p>
              <div className="bg-white border border-[#e6e8ea] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-3.5 h-3.5 text-blue-500" />
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    result.hiringSuggestion === 'Strong Yes' ? 'bg-emerald-100 text-emerald-700' :
                    result.hiringSuggestion === 'Yes'        ? 'bg-blue-100 text-blue-700' :
                    result.hiringSuggestion === 'Maybe'      ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {result.hiringSuggestion === 'Strong Yes' ? 'HIGHLY RECOMMENDED' :
                     result.hiringSuggestion === 'Yes'        ? 'RECOMMENDED' :
                     result.hiringSuggestion === 'Maybe'      ? 'CONSIDER' : 'NOT RECOMMENDED'}
                  </span>
                </div>
                <p className="text-[12px] text-[#45464d] leading-relaxed">
                  {result.recommendation || 'No recommendation provided.'}
                </p>
              </div>

              {t && (
                <div className="mt-3 space-y-1.5">
                  {t.email && (
                    <p className="text-[11px] text-[#76777d]">
                      <span className="font-semibold text-[#45464d]">Email: </span>
                      <a href={`mailto:${t.email}`} className="hover:text-blue-600 transition-colors">{t.email}</a>
                    </p>
                  )}
                  {t.experienceYears > 0 && (
                    <p className="text-[11px] text-[#76777d]">
                      <span className="font-semibold text-[#45464d]">Experience: </span>
                      {t.experienceYears} year{t.experienceYears !== 1 ? 's' : ''}
                    </p>
                  )}
                  {(t.skills?.length ?? 0) > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-[#45464d]">Top Skills: </span>
                      <span className="text-[11px] text-[#76777d]">
                        {t.skills.slice(0, 4).map((s) => (typeof s === 'string' ? s : s.name)).join(', ')}
                      </span>
                    </div>
                  )}
                  {t.socialLinks?.linkedin && (
                    <a href={t.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline">
                      View LinkedIn →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Results panel ───────────────────────────────────────────────── */
function ResultsPanel({
  results, job, weights,
}: {
  results: PopulatedResult[];
  job: Job;
  weights: typeof DEFAULT_WEIGHTS;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const strongYes = results.filter((r) => r.hiringSuggestion === 'Strong Yes').length;
  const yesCount  = results.filter((r) => r.hiringSuggestion === 'Yes').length;
  const avgScore  = results.length
    ? Math.round(results.reduce((s, r) => s + r.matchScore, 0) / results.length)
    : 0;

  const isTopShortlist = job.applicantCount >= 15 && results.length <= job.shortlistTarget;

  return (
    <div className="space-y-4">
      {/* Top N callout when applicant pool is large */}
      {isTopShortlist && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Trophy className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-blue-800">
            Top {results.length} shortlisted
            <span className="font-normal text-blue-600 ml-1">
              · selected from {job.applicantCount} applicants for <strong>{job.title}</strong>
            </span>
          </p>
        </div>
      )}

      {/* Summary banner */}
      <div className="bg-[#0f172a] rounded-lg p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Screening Complete</p>
            <p className="font-bold text-white text-[15px]">
              {isTopShortlist ? (
                <>
                  <span className="text-amber-400 font-black">TOP {results.length}</span>
                  {' '}candidates ranked for{' '}
                  <span className="text-blue-400">{job.title}</span>
                </>
              ) : (
                <>Top {results.length} candidates ranked for <span className="text-blue-400">{job.title}</span></>
              )}
            </p>
          </div>
          <button
            onClick={() => exportCSV(results, job.title)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-2xl font-black text-white">{results.length}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wide">Shortlisted</p>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400">{strongYes + yesCount}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wide">Recommended</p>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-400">{avgScore}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wide">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Fit distribution chips */}
      <div className="flex flex-wrap gap-2">
        {(['Strong Yes', 'Yes', 'Maybe', 'No'] as const).map((s) => {
          const count = results.filter((r) => r.hiringSuggestion === s).length;
          if (count === 0) return null;
          const { label, cls } = fitMeta(s);
          return (
            <div key={s} className="flex items-center gap-1.5">
              <span className={cls}>{label}</span>
              <span className="text-xs font-bold text-[#45464d]">×{count}</span>
            </div>
          );
        })}
      </div>

      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-[32px_1fr_72px_140px_120px_16px] gap-3 px-4 pb-1">
        <div />
        <p className="section-label">CANDIDATE</p>
        <p className="section-label text-center">SCORE</p>
        <p className="section-label">FIT</p>
        <p className="section-label">VERDICT</p>
        <div />
      </div>

      {/* Candidate rows */}
      <div className="space-y-2">
        {results.map((r) => (
          <CandidateRow
            key={r._id}
            result={r}
            rank={r.rank}
            weights={weights}
            expanded={expandedId === r._id}
            onToggle={() => setExpandedId(expandedId === r._id ? null : r._id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Searchable job select ───────────────────────────────────────── */
function ScreeningJobSelect({
  jobs,
  selected,
  onSelect,
}: {
  jobs: Job[];
  selected: Job | null;
  onSelect: (job: Job) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const containerRef          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = jobs.filter((j) =>
    `${j.title} ${j.department ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const statusDot = (status: string) =>
    status === 'completed' ? 'bg-blue-500' :
    status === 'screening' ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQuery(''); }}
        className="w-full flex items-center gap-2 bg-[#f7f9fb] border border-[#e6e8ea] rounded-md px-3 py-2.5 text-sm text-[#191c1e] font-medium focus:outline-none focus:ring-2 focus:ring-[#0f172a] text-left"
      >
        {selected ? (
          <>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(selected.status)}`} />
            <span className="flex-1 truncate">
              {selected.title}
              <span className="text-[#76777d] font-normal ml-2">
                — {selected.applicantCount} applicant{selected.applicantCount !== 1 ? 's' : ''} · {selected.status}
              </span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-[#76777d]">Choose a job…</span>
        )}
        <ChevronDown className={`w-4 h-4 text-[#76777d] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#e6e8ea] rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[#f2f4f6]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#76777d]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search jobs…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-[#f7f9fb] border border-[#e6e8ea] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[#76777d] text-center">No jobs found</li>
            ) : filtered.map((j) => (
              <li key={j._id}>
                <button
                  type="button"
                  onClick={() => { onSelect(j); setOpen(false); setQuery(''); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#f7f9fb] transition-colors ${selected?._id === j._id ? 'bg-[#f0f4ff]' : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(j.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#191c1e] truncate">{j.title}</p>
                    <p className="text-[11px] text-[#76777d] truncate">
                      {j.department && <span>{j.department} · </span>}
                      {j.applicantCount} applicant{j.applicantCount !== 1 ? 's' : ''} · {j.status}
                    </p>
                  </div>
                  {selected?._id === j._id && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
export default function ScreeningPage() {
  const dispatch = useAppDispatch();
  const { items: jobs, loading: jobsLoading } = useAppSelector((s) => s.jobs);
  const { running, error, lastRunJobId, results, lastScoringMode } = useAppSelector((s) => s.screening);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const [weights] = useState(DEFAULT_WEIGHTS);

  // Recompute match scores when weights change
  const dynamicResults: PopulatedResult[] = useMemo(() => {
    if (!results.length) return [];
    const total = weights.skills + weights.experience + weights.education + weights.relevance;
    if (total === 0) return results;
    return [...results]
      .map((r) => {
        const s = r.scoreBreakdown;
        const score = Math.round(
          (s.skills * weights.skills + s.experience * weights.experience +
           s.education * weights.education + s.relevance * weights.relevance) / total
        );
        const sugg =
          score >= 85 ? 'Strong Yes' :
          score >= 70 ? 'Yes' :
          score >= 50 ? 'Maybe' : 'No';
        return { ...r, matchScore: score, hiringSuggestion: sugg as any };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [results, weights]);

  useEffect(() => { dispatch(fetchJobs()); }, [dispatch]);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) setSelectedJob(jobs[0] ?? null);
  }, [jobs, selectedJob]);

  const loadResults = useCallback(async (job: Job) => {
    if (job.status === 'completed') {
      setLoadingResults(true);
      await dispatch(fetchShortlist(job._id));
      setLoadingResults(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (selectedJob) loadResults(selectedJob);
  }, [selectedJob, loadResults]);

  const handleJobChange = (job: Job) => {
    setSelectedJob(job);
  };

  const handleStart = () => {
    if (!selectedJob) return;
    if (selectedJob.applicantCount === 0) { alert('This job has no applicants yet.'); return; }
    if (window.confirm(
      `Run AI screening for "${selectedJob.title}"?\n\nGemini will evaluate all ${selectedJob.applicantCount} candidate(s) and rank the Top ${selectedJob.shortlistTarget}.`
    )) {
      dispatch(runScreening(selectedJob._id));
    }
  };

  const isCompletedJob = selectedJob?.status === 'completed';
  const showResults    = (lastRunJobId === selectedJob?._id || isCompletedJob) && dynamicResults.length > 0 && !running;

  return (
    <div className="max-w-3xl lg:max-w-none space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1e]">AI Screening</h1>
          <p className="text-[#45464d] text-sm mt-0.5">
            Evaluate candidates with Gemini 2.0 Flash and view your ranked shortlist here.
          </p>
        </div>
        {showResults && selectedJob && (
          <button
            onClick={() => {
              if (window.confirm(`Re-run AI screening for "${selectedJob.title}"? Existing results will be replaced.`)) {
                dispatch(runScreening(selectedJob._id));
              }
            }}
            disabled={running}
            className="flex items-center gap-2 border border-[#e6e8ea] rounded-md px-3 py-2 text-sm font-semibold text-[#45464d] hover:bg-[#f2f4f6] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-run Screening
          </button>
        )}
      </div>

      <div className="space-y-5">

          {/* Job Selector */}
          <div className="card p-5">
            <p className="section-label mb-3">Select Job</p>
            {jobsLoading ? (
              <div className="h-10 bg-[#f2f4f6] rounded-md animate-pulse" />
            ) : (
              <ScreeningJobSelect
                jobs={jobs}
                selected={selectedJob}
                onSelect={handleJobChange}
              />
            )}

            {selectedJob && (
              <div className="mt-4 pt-4 border-t border-[#f2f4f6] grid grid-cols-3 gap-4">
                <div>
                  <p className="section-label mb-0.5">APPLICANTS</p>
                  <p className="text-[15px] font-bold text-[#191c1e]">{selectedJob.applicantCount}</p>
                </div>
                <div>
                  <p className="section-label mb-0.5">SHORTLIST</p>
                  <p className="text-[15px] font-bold text-[#191c1e]">Top {selectedJob.shortlistTarget}</p>
                </div>
                <div>
                  <p className="section-label mb-0.5">STATUS</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                    selectedJob.status === 'active'    ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]' :
                    selectedJob.status === 'screening' ? 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]' :
                    'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
                  }`}>
                    {selectedJob.status === 'active' ? 'READY' : selectedJob.status.toUpperCase()}
                  </span>
                </div>

                {selectedJob.requiredSkills?.length > 0 && (
                  <div className="col-span-3">
                    <p className="section-label mb-2">REQUIRED SKILLS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.requiredSkills.slice(0, 8).map((s) => (
                        <span key={s} className="skill-must">{s}</span>
                      ))}
                      {selectedJob.requiredSkills.length > 8 && (
                        <span className="text-[11px] text-[#76777d] self-center">
                          +{selectedJob.requiredSkills.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rule-based scoring notice */}
          {lastScoringMode === 'rule-based' && showResults && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Rule-based scoring used</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Gemini API quota was exceeded — results were scored using a rule-based engine.
                  Re-run screening when quota resets for full AI analysis.
                </p>
              </div>
            </div>
          )}

          {/* No applicants state */}
          {selectedJob && selectedJob.applicantCount === 0 && (
            <div className="card p-8 text-center">
              <Users className="w-10 h-10 text-[#e6e8ea] mx-auto mb-3" />
              <p className="font-semibold text-[#191c1e] text-sm">No candidates uploaded</p>
              <p className="text-xs text-[#76777d] mt-1 mb-4">
                Upload candidates on the Candidates page before running screening.
              </p>
              <Link href="/applicants">
                <button className="btn-primary mx-auto text-sm">
                  Upload Candidates <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card p-4 bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-red-900">Screening failed</p>
                <p className="text-sm text-red-700 mt-0.5">{error}</p>
                <button onClick={() => dispatch(clearError())} className="text-xs text-red-500 hover:underline mt-1.5">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Run button */}
          {selectedJob && selectedJob.applicantCount > 0 && !running && (
            <button
              onClick={handleStart}
              className="btn-primary w-full py-3 text-sm justify-center"
            >
              <Brain className="w-4 h-4" />
              {isCompletedJob ? 'Re-run AI Screening' : `Run AI Screening — Top ${selectedJob.shortlistTarget}`}
            </button>
          )}

          {/* In-progress */}
          {running && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="font-bold text-sm text-[#191c1e]">Gemini is evaluating candidates…</p>
                  <p className="text-xs text-[#76777d] mt-0.5">Scoring {selectedJob?.applicantCount} profiles against job requirements</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-[#f2f4f6] rounded-full overflow-hidden">
                <div className="h-full bg-[#0f172a] rounded-full animate-pulse w-2/3" />
              </div>
              <p className="text-[11px] text-[#76777d] mt-2">
                This typically takes 30–60 seconds. Do not close this tab.
              </p>
            </div>
          )}

          {/* Loading existing results */}
          {loadingResults && (
            <div className="flex items-center gap-2 text-sm text-[#76777d]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading shortlist results…
            </div>
          )}

          {/* Results */}
          {showResults && selectedJob && (
            <ResultsPanel results={dynamicResults} job={selectedJob} weights={weights} />
          )}

          {/* Empty state for completed job with no cached results */}
          {isCompletedJob && !loadingResults && !showResults && !running && !error && (
            <div className="card p-6 text-center">
              <Star className="w-8 h-8 text-[#e6e8ea] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#191c1e]">No results found</p>
              <p className="text-xs text-[#76777d] mt-1">Run screening to generate the shortlist.</p>
            </div>
          )}
      </div>
    </div>
  );
}
