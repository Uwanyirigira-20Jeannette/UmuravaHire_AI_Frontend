'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import type { Job } from '@/types';

interface DeptStat { _id: string; count: number; applicants: number }
interface Stats {
  totalJobs: number; activeJobs: number; completedJobs: number;
  totalApplicants: number; screened: number; shortlisted: number;
  recentJobs: Job[];
  byDepartment?: DeptStat[];
}

const STATUS_LABEL: Record<string, string> = {
  active: 'SHORTLISTING',
  screening: 'SCREENING',
  completed: 'COMPLETED',
};

const STATUS_CLS: Record<string, string> = {
  active:    'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]',
  screening: 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]',
  completed: 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]',
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return 'Yesterday';
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    fetch(`${API}/api/dashboard`).then((r) => r.json()).then(setStats).finally(() => setLoading(false));
  }, [API]);

  const noJobs = !loading && (stats?.totalJobs ?? 0) === 0;

  /* Generate activity feed from recent jobs */
  const activities = stats?.recentJobs?.slice(0, 4).map((job, i) => {
    if (job.status === 'completed') return { icon: 'check', color: 'bg-emerald-50 text-emerald-600', text: `Screening completed for `, bold: job.title, time: timeAgo(job.updatedAt) };
    if (job.status === 'screening') return { icon: 'cpu', color: 'bg-amber-50 text-amber-600', text: `AI screening started for `, bold: job.title, time: timeAgo(job.updatedAt) };
    return { icon: 'plus', color: 'bg-blue-50 text-blue-600', text: `New role posted: `, bold: job.title, time: timeAgo(job.createdAt) };
  }) ?? [];

  const statCards = [
    {
      label: 'CANDIDATES TO REVIEW',
      value: stats?.totalApplicants ?? 0,
      sub: stats?.shortlisted ? `+${stats.shortlisted} shortlisted` : 'Upload candidates',
      subColor: 'text-emerald-600',
    },
    {
      label: 'ACTIVE JOB POSTINGS',
      value: stats?.totalJobs ?? 0,
      sub: stats?.activeJobs ? `${stats.activeJobs} active` : 'No postings yet',
      subColor: 'text-[#45464d]',
    },
    {
      label: 'SCREENED BY AI',
      value: stats?.screened ?? 0,
      sub: stats?.screened ? 'Jobs processed' : 'Run AI screening',
      subColor: stats?.screened ? 'text-blue-600' : 'text-[#76777d]',
    },
    {
      label: 'SHORTLISTED',
      value: stats?.shortlisted ?? 0,
      sub: stats?.shortlisted ? `From ${stats.completedJobs} completed job${stats.completedJobs !== 1 ? 's' : ''}` : 'Run AI screening',
      subColor: stats?.shortlisted ? 'text-emerald-600' : 'text-[#76777d]',
    },
  ];

  return (
    <div className="max-w-3xl lg:max-w-none space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1e]">Recruitment Overview</h1>
          <p className="text-[#45464d] text-sm mt-0.5">Manage your active job postings and candidate pipeline.</p>
        </div>
      </div>

      {/* Create Job CTA */}
      <Link href="/jobs">
        <button className="btn-primary rounded-md px-5 py-2.5">
          <Plus className="w-4 h-4" />
          <span className="text-[13px] font-semibold tracking-wide">CREATE NEW JOB</span>
        </button>
      </Link>

      {/* ── Stats Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-[#eceef0]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className="card p-4">
              <p className="section-label mb-2 text-[10px]">{card.label}</p>
              <p className="text-3xl font-bold text-[#191c1e] leading-none mb-1">{card.value}</p>
              <p className={`text-xs font-medium ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Get Started (empty state) ── */}
      {noJobs && (
        <div className="card border border-[#e6e8ea]">
          <h2 className="font-bold text-[#191c1e] mb-5">Get started in 4 steps</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { n: '01', t: 'Post a Job', d: 'Define role, skills, experience' },
              { n: '02', t: 'Upload Candidates', d: 'CSV, PDF, or Umurava import' },
              { n: '03', t: 'Run AI Screening', d: 'Gemini scores all candidates' },
              { n: '04', t: 'View Shortlist', d: 'Ranked top candidates with reasoning' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <p className="text-4xl font-black text-[#e6e8ea] mb-2">{s.n}</p>
                <p className="font-semibold text-[#191c1e] text-sm mb-0.5">{s.t}</p>
                <p className="text-xs text-[#76777d]">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/jobs">
              <button className="btn-primary mx-auto">Create your first job <ArrowRight className="w-4 h-4" /></button>
            </Link>
          </div>
        </div>
      )}

      {!noJobs && !loading && (
        <div className="space-y-4">
          {/* ── Active Postings ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-[#191c1e] text-[15px]">Active Postings</h2>
              <Link href="/jobs" className="text-xs text-[#45464d] font-semibold hover:text-[#0f172a] flex items-center gap-1">
                VIEW ALL <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {stats?.recentJobs?.slice(0, 3).map((job) => (
                <Link key={job._id} href={`/jobs?id=${job._id}`} className="card p-4 block hover:border-[#c6c6cd] hover:shadow-sm transition-all cursor-pointer flex flex-col">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#191c1e] text-[14px] leading-snug">{job.title}</p>
                      <p className="text-xs text-[#45464d] mt-0.5">{job.department} · {(job as any).location || 'Remote'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide whitespace-nowrap flex-shrink-0 ${STATUS_CLS[job.status]}`}>
                      {STATUS_LABEL[job.status]}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-[#f7f9fb] rounded-md px-2 py-1.5 text-center">
                      <p className="text-[10px] text-[#76777d] font-semibold uppercase tracking-wide">Applicants</p>
                      <p className="text-[15px] font-bold text-[#191c1e]">{job.applicantCount}</p>
                    </div>
                    <div className="bg-[#f7f9fb] rounded-md px-2 py-1.5 text-center">
                      <p className="text-[10px] text-[#76777d] font-semibold uppercase tracking-wide">Skills</p>
                      <p className="text-[15px] font-bold text-[#191c1e]">{job.requiredSkills?.length ?? 0}</p>
                    </div>
                    <div className="bg-[#f7f9fb] rounded-md px-2 py-1.5 text-center">
                      <p className="text-[10px] text-[#76777d] font-semibold uppercase tracking-wide">Target</p>
                      <p className="text-[15px] font-bold text-[#191c1e]">Top {job.shortlistTarget}</p>
                    </div>
                  </div>

                  {/* Skills preview */}
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {job.requiredSkills?.slice(0, 4).map((s) => (
                      <span key={s} className="text-[10px] bg-[#f2f4f6] text-[#45464d] px-2 py-0.5 rounded uppercase font-semibold tracking-wide">{s}</span>
                    ))}
                    {(job.requiredSkills?.length ?? 0) > 4 && (
                      <span className="text-[10px] text-[#76777d] px-1 py-0.5">+{job.requiredSkills.length - 4} more</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Recent Activity ── */}
          {activities.length > 0 && (
            <div>
              <h2 className="font-bold text-[#191c1e] text-[15px] mb-2">Recent Activity</h2>
              <div className="card p-0 overflow-hidden">
                {activities.map((act, i) => {
                  const Icon = act.icon === 'check' ? CheckCircle2 : act.icon === 'plus' ? Plus : TrendingUp;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-4 ${i < activities.length - 1 ? 'border-b border-[#f2f4f6]' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${act.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#45464d]">
                          {act.text}<span className="font-semibold text-[#191c1e]">{act.bold}</span>
                        </p>
                        <p className="text-[11px] text-[#76777d] mt-0.5 uppercase tracking-wide">{act.time}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="px-4 py-3 border-t border-[#f2f4f6]">
                  <Link href="/jobs" className="text-xs font-semibold text-[#45464d] hover:text-[#0f172a] flex items-center justify-center gap-1">
                    VIEW ALL ACTIVITY <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
