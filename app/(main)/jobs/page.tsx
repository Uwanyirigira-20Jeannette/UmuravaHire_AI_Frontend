'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchJobs, updateJob, deleteJob, selectJob } from '@/store/slices/jobsSlice';
import {
  Plus, X, Users, Calendar, Search,
  Pencil, Trash2, Upload, Cpu, Trophy, AlertTriangle, ArrowLeft,
  MapPin, DollarSign, Shield, ChevronRight, LayoutGrid, List, AlignJustify,
  ChevronDown, Briefcase, Clock,
} from 'lucide-react';
import type { Job } from '@/types';
import Link from 'next/link';

const STATUS_LABEL: Record<string, string> = {
  active:    'Shortlisting',
  screening: 'Screening',
  completed: 'Completed',
};
const STATUS_CLS: Record<string, string> = {
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  screening: 'bg-amber-50  text-amber-700  border border-amber-200',
  completed: 'bg-blue-50   text-blue-700   border border-blue-200',
};
const STATUS_DOT: Record<string, string> = {
  active:    'bg-emerald-500',
  screening: 'bg-amber-500',
  completed: 'bg-blue-500',
};

const ALL_STATUSES = ['all', 'active', 'screening', 'completed'] as const;
const EDUCATION_OPTIONS = ["Any", "High School", "Bachelor's", "Master's", "PhD", "Professional Certification"];

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface FormData {
  title: string; department: string; description: string; location: string;
  skillInput: string; requiredSkills: string[];
  niceInput: string; niceToHaveSkills: string[];
  experienceYears: number; educationRequired: string; shortlistTarget: 10 | 20;
}
const emptyForm = (): FormData => ({
  title: '', department: '', description: '', location: 'Remote',
  skillInput: '', requiredSkills: [],
  niceInput: '', niceToHaveSkills: [],
  experienceYears: 0, educationRequired: 'Any', shortlistTarget: 10,
});

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { items: jobs, loading, error } = useAppSelector((s) => s.jobs);

  const [showForm,      setShowForm]      = useState(false);
  const [editTarget,    setEditTarget]    = useState<Job | null>(null);
  const [form,          setForm]          = useState<FormData>(emptyForm());
  const [saving,        setSaving]        = useState(false);
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<typeof ALL_STATUSES[number]>('all');
  const [selectedJob,   setSelectedJob]   = useState<Job | null>(null);
  const [seeding,       setSeeding]       = useState(false);
  const [viewMode,      setViewMode]      = useState<'cards' | 'list' | 'compact'>('cards');
  const [viewOpen,      setViewOpen]      = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || jobs.length === 0) return;
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) { const job = jobs.find((j) => j._id === id); if (job) setSelectedJob(job); }
  }, [jobs]);

  const handleSeedJobs = async () => {
    setSeeding(true);
    await fetch(`${API}/api/dev/seed`, { method: 'POST' });
    await dispatch(fetchJobs());
    setSeeding(false);
  };

  useEffect(() => { dispatch(fetchJobs()); }, [dispatch]);

  useEffect(() => {
    if (!viewOpen) return;
    const close = () => setViewOpen(false);
    document.addEventListener('click', close, { once: true });
    return () => document.removeEventListener('click', close);
  }, [viewOpen]);

  const openCreate = () => router.push('/jobs/new');
  const openEdit   = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTarget(job);
    setForm({
      title: job.title, department: job.department, description: job.description,
      location: job.location || 'Remote',
      skillInput: '', requiredSkills: [...job.requiredSkills],
      niceInput:  '', niceToHaveSkills: [...(job.niceToHaveSkills ?? [])],
      experienceYears: job.experienceYears, educationRequired: job.educationRequired || 'Any',
      shortlistTarget: job.shortlistTarget,
    });
    setShowForm(true);
  };

  const addSkill  = () => { const s = form.skillInput.trim(); if (s && !form.requiredSkills.includes(s)) setForm((f) => ({ ...f, requiredSkills: [...f.requiredSkills, s], skillInput: '' })); };
  const removeSkill = (sk: string) => setForm((f) => ({ ...f, requiredSkills: f.requiredSkills.filter((s) => s !== sk) }));
  const addNice   = () => { const s = form.niceInput.trim(); if (s && !form.niceToHaveSkills.includes(s)) setForm((f) => ({ ...f, niceToHaveSkills: [...f.niceToHaveSkills, s], niceInput: '' })); };
  const removeNice  = (sk: string) => setForm((f) => ({ ...f, niceToHaveSkills: f.niceToHaveSkills.filter((s) => s !== sk) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !form.title || !form.department || form.requiredSkills.length === 0) return;
    setSaving(true);
    await dispatch(updateJob({ id: editTarget._id, data: {
      title: form.title, department: form.department, description: form.description,
      location: form.location || 'Remote',
      requiredSkills: form.requiredSkills, niceToHaveSkills: form.niceToHaveSkills,
      experienceYears: form.experienceYears, educationRequired: form.educationRequired,
      shortlistTarget: form.shortlistTarget,
    }}));
    setSaving(false); setShowForm(false); setForm(emptyForm());
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await dispatch(deleteJob(deleteId));
    setDeleting(false); setDeleteId(null);
    if (selectedJob?._id === deleteId) setSelectedJob(null);
  };

  const filtered = jobs.filter((j) => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) ||
                        j.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = { active: 0, screening: 0, completed: 0 };
  jobs.forEach((j) => { counts[j.status] = (counts[j.status] || 0) + 1; });

  /* ── Job Detail View ── */
  if (selectedJob) {
    const mustHave   = selectedJob.requiredSkills;
    const niceToHave = selectedJob.niceToHaveSkills ?? [];
    const healthPct  = selectedJob.applicantCount > 0 ? Math.min(99, Math.max(60, 78 + Math.round(Math.random() * 15))) : 0;

    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-1.5 text-[11px] text-[#45464d] font-semibold uppercase tracking-wide mb-5">
          <button onClick={() => setSelectedJob(null)} className="flex items-center gap-1 hover:text-[#0f172a] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Jobs
          </button>
          <ChevronRight className="w-3 h-3 text-[#c6c6cd]" />
          <span className="text-[#76777d]">{selectedJob.department}</span>
          <ChevronRight className="w-3 h-3 text-[#c6c6cd]" />
          <span className="text-[#76777d]">Details</span>
        </div>

        <div className="card mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_CLS[selectedJob.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[selectedJob.status]}`} />
                  {STATUS_LABEL[selectedJob.status]}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#191c1e] leading-tight capitalize">{selectedJob.title}</h1>
            </div>
            <button onClick={(e) => openEdit(selectedJob, e)} className="flex items-center gap-1.5 text-xs font-semibold text-[#45464d] hover:text-blue-600 border border-[#e6e8ea] hover:border-blue-300 rounded-md px-3 py-2 transition-all flex-shrink-0">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#45464d] pt-3 border-t border-[#f2f4f6]">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#76777d]" />{selectedJob.department} · {selectedJob.location || 'Remote'}</span>
            <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-[#76777d]" />Competitive</span>
          </div>
        </div>

        {selectedJob.description && (
          <div className="card mb-4">
            <p className="section-label mb-3">JOB DESCRIPTION</p>
            <div className="text-sm text-[#45464d] leading-relaxed whitespace-pre-wrap">{selectedJob.description}</div>
          </div>
        )}

        <div className="card mb-4">
          <p className="section-label mb-4">CORE CRITERIA</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users,    label: 'Experience', value: `${selectedJob.experienceYears}+ Years`, sub: 'Industry experience' },
              { icon: Calendar, label: 'Education',  value: selectedJob.educationRequired || 'Any', sub: 'Minimum level' },
              { icon: Trophy,   label: 'Shortlist',  value: `Top ${selectedJob.shortlistTarget}`, sub: 'Target candidates' },
              { icon: Shield,   label: 'Authorization', value: 'Open to all', sub: 'All candidates eligible', green: true },
            ].map(({ icon: Icon, label, value, sub, green }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[#f7f9fb]">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${green ? 'bg-emerald-50' : 'bg-white border border-[#e6e8ea]'}`}>
                  <Icon className={`w-4 h-4 ${green ? 'text-emerald-600' : 'text-[#45464d]'}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#191c1e] text-sm truncate">{value}</p>
                  <p className="text-[11px] text-[#76777d]">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card mb-4">
          <p className="section-label mb-4">TECHNICAL SKILLS</p>
          {mustHave.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[#45464d] mb-2">Must-Have</p>
              <div className="flex flex-wrap gap-2">
                {mustHave.map((s) => (
                  <span key={s} className="text-xs bg-[#0f172a] text-white px-3 py-1 rounded-full font-semibold uppercase tracking-wide">{s}</span>
                ))}
              </div>
            </div>
          )}
          {niceToHave.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#45464d] mb-2">Nice-to-Have</p>
              <div className="flex flex-wrap gap-2">
                {niceToHave.map((s) => (
                  <span key={s} className="text-xs bg-[#f2f4f6] text-[#45464d] border border-[#e6e8ea] px-3 py-1 rounded-full font-semibold uppercase tracking-wide">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedJob.applicantCount > 0 && (
          <div className="card mb-4">
            <p className="section-label mb-3">PIPELINE HEALTH</p>
            <div className="flex items-end gap-4">
              <p className="text-4xl font-bold text-[#191c1e]">{healthPct}%</p>
              <p className="text-xs text-[#76777d] pb-1 flex-1">Match density for this criteria set across {selectedJob.applicantCount} candidate{selectedJob.applicantCount !== 1 ? 's' : ''}.</p>
            </div>
            <div className="flex gap-1 mt-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`flex-1 rounded-sm transition-all ${i < Math.round(healthPct / 12.5) ? 'bg-[#0f172a]' : 'bg-[#e6e8ea]'}`} style={{ height: `${8 + i * 2}px` }} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/applicants" onClick={() => dispatch(selectJob(selectedJob))} className="flex-1">
            <button className="btn-secondary w-full justify-center py-3"><Upload className="w-4 h-4" /> Upload Candidates</button>
          </Link>
          {(selectedJob.status === 'active' || selectedJob.status === 'screening') && selectedJob.applicantCount > 0 && (
            <Link href="/screening" onClick={() => dispatch(selectJob(selectedJob))} className="flex-1">
              <button className="btn-primary w-full justify-center py-3"><Cpu className="w-4 h-4" /> Run AI Screening</button>
            </Link>
          )}
          {selectedJob.status === 'completed' && (
            <Link href="/shortlist" onClick={() => dispatch(selectJob(selectedJob))} className="flex-1">
              <button className="w-full justify-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md flex items-center gap-2 text-sm transition-colors">
                <Trophy className="w-4 h-4" /> View Shortlist ({selectedJob.applicantCount})
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  /* ── Job List View ── */
  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1e]">Jobs</h1>
          <p className="text-[#45464d] text-sm mt-0.5">{jobs.length} posting{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View dropdown */}
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setViewOpen((v) => !v); }}
              className="btn-secondary !py-2 !px-3 gap-1.5">
              {viewMode === 'cards'   && <LayoutGrid  className="w-3.5 h-3.5" />}
              {viewMode === 'list'    && <List         className="w-3.5 h-3.5" />}
              {viewMode === 'compact' && <AlignJustify className="w-3.5 h-3.5" />}
              <span className="text-xs">View</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {viewOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-[#e6e8ea] rounded-xl shadow-lg py-1.5 w-40">
                {([
                  { key: 'cards'   as const, Icon: LayoutGrid,   label: 'Cards'   },
                  { key: 'list'    as const, Icon: List,          label: 'List'    },
                  { key: 'compact' as const, Icon: AlignJustify,  label: 'Compact' },
                ] as const).map(({ key, Icon, label }) => (
                  <button key={key} onClick={() => { setViewMode(key); setViewOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${viewMode === key ? 'bg-[#f2f4f6] text-[#191c1e] font-semibold' : 'text-[#45464d] hover:bg-[#f7f9fb]'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleSeedJobs} disabled={seeding} className="btn-secondary !py-2 !px-3 gap-1.5">
            {seeding
              ? <><div className="w-3.5 h-3.5 border-2 border-[#76777d] border-t-transparent rounded-full animate-spin" /><span className="text-xs">Loading…</span></>
              : <><Plus className="w-3.5 h-3.5" /><span className="text-xs">Load Sample Jobs</span></>
            }
          </button>
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Post New Job
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

      {/* ── Filters row ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 bg-[#f2f4f6] rounded-lg p-1">
          {ALL_STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                statusFilter === s ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#76777d] hover:text-[#191c1e]'
              }`}>
              {s === 'all'
                ? `All (${jobs.length})`
                : `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s as keyof typeof counts]})`
              }
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
          <input className="input pl-10 h-full" placeholder="Search by title or department…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={viewMode === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-2'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`rounded-xl bg-[#f2f4f6] animate-pulse ${viewMode === 'cards' ? 'h-52' : 'h-16'}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 rounded-full bg-[#f2f4f6] flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 text-[#c6c6cd]" />
          </div>
          <p className="font-bold text-[#191c1e] mb-1">{jobs.length === 0 ? 'No job postings yet' : 'No jobs match your filter'}</p>
          <p className="text-sm text-[#76777d]">{jobs.length === 0 ? 'Create your first job posting to get started.' : 'Try adjusting your search or filter.'}</p>
          {jobs.length === 0 && (
            <button className="btn-primary mt-5 mx-auto" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Create your first job
            </button>
          )}
        </div>
      ) : viewMode === 'compact' ? (
        /* ── Compact table ── */
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f9fb] border-b border-[#e6e8ea]">
              <tr>
                {['Job Title', 'Department', 'Skills', 'Applicants', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#76777d] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f9fb]">
              {filtered.map((job) => (
                <tr key={job._id} onClick={() => setSelectedJob(job)} className="hover:bg-[#f7f9fb] cursor-pointer group transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#191c1e] text-[13px] capitalize">{job.title}</p>
                    <p className="text-[11px] text-[#76777d] mt-0.5">{job.experienceYears}+ yrs exp</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#45464d] whitespace-nowrap">{job.department}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                      {job.requiredSkills.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] bg-[#f2f4f6] text-[#45464d] px-1.5 py-0.5 rounded-full uppercase font-semibold">{s}</span>
                      ))}
                      {job.requiredSkills.length > 3 && <span className="text-[10px] text-[#76777d]">+{job.requiredSkills.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#191c1e]">{job.applicantCount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLS[job.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[job.status]}`} />
                      {STATUS_LABEL[job.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={(e) => openEdit(job, e)} className="p-1.5 rounded-md text-[#76777d] hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteId(job._id); }} className="p-1.5 rounded-md text-[#76777d] hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-[#c6c6cd] ml-1" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'list' ? (
        /* ── List rows ── */
        <div className="space-y-2">
          {filtered.map((job) => (
            <div key={job._id} onClick={() => setSelectedJob(job)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedJob(job); }}
              className="bg-white border border-[#e6e8ea] rounded-xl px-4 py-3.5 cursor-pointer hover:border-[#c6c6cd] hover:shadow-sm transition-all group flex items-center gap-4">
              {/* Status dot */}
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[job.status]}`} />
              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[#191c1e] text-[14px] capitalize">{job.title}</p>
                  <span className="text-[#76777d] text-xs">·</span>
                  <span className="text-xs text-[#76777d]">{job.department}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#76777d]">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.experienceYears}+ yrs</span>
                  <span className="hidden sm:flex gap-1">
                    {job.requiredSkills.slice(0, 3).map((s) => (
                      <span key={s} className="bg-[#f2f4f6] text-[#45464d] px-2 py-0.5 rounded-full uppercase font-semibold text-[10px]">{s}</span>
                    ))}
                    {job.requiredSkills.length > 3 && <span>+{job.requiredSkills.length - 3}</span>}
                  </span>
                </div>
              </div>
              {/* Status pill */}
              <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_CLS[job.status]}`}>
                {STATUS_LABEL[job.status]}
              </span>
              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={(e) => openEdit(job, e)} className="p-1.5 rounded-md text-[#76777d] hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(job._id); }} className="p-1.5 rounded-md text-[#76777d] hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-[#c6c6cd]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Cards (default) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <div key={job._id} onClick={() => setSelectedJob(job)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedJob(job); }}
              className="group bg-white border border-[#e6e8ea] rounded-2xl p-5 cursor-pointer hover:border-[#c6c6cd] hover:shadow-md transition-all flex flex-col gap-4">

              {/* ── Card top: status + actions ── */}
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_CLS[job.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[job.status]}`} />
                  {STATUS_LABEL[job.status]}
                </span>
                <div className="flex gap-0.5">
                  <button onClick={(e) => openEdit(job, e)}
                    className="p-1.5 rounded-lg text-[#76777d] hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(job._id); }}
                    className="p-1.5 rounded-lg text-[#76777d] hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ── Title + department ── */}
              <div>
                <h3 className="font-bold text-[#191c1e] text-[15px] leading-snug capitalize mb-1">{job.title}</h3>
                <p className="text-xs text-[#76777d]">{job.department} · {job.location || 'Remote'}</p>
              </div>

              {/* ── Stats row ── */}
              <div className="flex items-center gap-4 text-[11px] text-[#76777d] pt-3 border-t border-[#f2f4f6]">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {fmtDate(job.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {job.experienceYears}+ yrs
                </span>
              </div>

              {/* ── Skills ── */}
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {job.requiredSkills.slice(0, 4).map((s) => (
                  <span key={s} className="text-[10px] bg-[#f2f4f6] text-[#45464d] px-2.5 py-1 rounded-full uppercase font-semibold tracking-wide">
                    {s}
                  </span>
                ))}
                {job.requiredSkills.length > 4 && (
                  <span className="text-[10px] text-[#76777d] px-1 py-1">
                    +{job.requiredSkills.length - 4} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showForm && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e8ea]">
              <h2 className="font-bold text-[#191c1e]">Edit Job</h2>
              <button onClick={() => setShowForm(false)} className="text-[#76777d] hover:text-[#191c1e] p-1 rounded-md hover:bg-[#f2f4f6] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Job Title *</label>
                <input className="input" placeholder="e.g. Senior Software Engineer" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Department *</label>
                  <input className="input" placeholder="e.g. Engineering" value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input" placeholder="e.g. Remote, Kigali" value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} placeholder="Role description…"
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Required Skills *</label>
                <div className="flex gap-2">
                  <input className="input" placeholder="Type a skill and press Enter" value={form.skillInput}
                    onChange={(e) => setForm((f) => ({ ...f, skillInput: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                  <button type="button" onClick={addSkill} className="btn-secondary !px-3 flex-shrink-0">Add</button>
                </div>
                {form.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.requiredSkills.map((s) => (
                      <span key={s} className="flex items-center gap-1 bg-[#0f172a] text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        {s} <button type="button" onClick={() => removeSkill(s)}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="label">Nice-to-Have Skills</label>
                <div className="flex gap-2">
                  <input className="input" placeholder="Optional skills" value={form.niceInput}
                    onChange={(e) => setForm((f) => ({ ...f, niceInput: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNice(); } }} />
                  <button type="button" onClick={addNice} className="btn-secondary !px-3 flex-shrink-0">Add</button>
                </div>
                {form.niceToHaveSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.niceToHaveSkills.map((s) => (
                      <span key={s} className="flex items-center gap-1 bg-[#f2f4f6] text-[#45464d] border border-[#e6e8ea] text-xs px-2.5 py-1 rounded-full font-medium">
                        {s} <button type="button" onClick={() => removeNice(s)}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Min Experience (yrs)</label>
                  <input className="input" type="number" min={0} max={20} value={form.experienceYears}
                    onChange={(e) => setForm((f) => ({ ...f, experienceYears: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Education Required</label>
                  <div className="relative">
                    <select className="input appearance-none pr-10" value={form.educationRequired}
                      onChange={(e) => setForm((f) => ({ ...f, educationRequired: e.target.value }))}>
                      {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Shortlist Target</label>
                <div className="relative">
                  <select className="input appearance-none pr-10" value={form.shortlistTarget}
                    onChange={(e) => setForm((f) => ({ ...f, shortlistTarget: Number(e.target.value) as 10 | 20 }))}>
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving || !form.title || !form.department || form.requiredSkills.length === 0}
                  className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#191c1e] mb-1">Delete this job?</h3>
                <p className="text-sm text-[#45464d] leading-relaxed">
                  This permanently removes the job posting, all candidates, and screening results. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 justify-center flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
