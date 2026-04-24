'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchJobs, updateJob, deleteJob, selectJob } from '@/store/slices/jobsSlice';
import {
  Plus, X, Users, Calendar, Search,
  Pencil, Trash2, Upload, Cpu, Trophy, AlertTriangle, ArrowLeft,
  MapPin, DollarSign, Shield, ChevronRight, LayoutGrid, List, AlignJustify,
  ChevronDown,
} from 'lucide-react';
import type { Job } from '@/types';
import Link from 'next/link';

const STATUS_LABEL: Record<string, string> = { active: 'SHORTLISTING ACTIVE', screening: 'SCREENING', completed: 'COMPLETED' };
const STATUS_CLS: Record<string, string> = {
  active:    'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]',
  screening: 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]',
  completed: 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]',
};
const ALL_STATUSES = ['all', 'active', 'screening', 'completed'] as const;

const EDUCATION_OPTIONS = ["Any", "High School", "Bachelor's", "Master's", "PhD", "Professional Certification"];

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

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items: jobs, loading, error } = useAppSelector((s) => s.jobs);

  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState<Job | null>(null);
  const [form, setForm]             = useState<FormData>(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof ALL_STATUSES[number]>('all');
  const [selectedJob, setSelectedJob]   = useState<Job | null>(null);
  const [seeding, setSeeding]           = useState(false);
  const [viewMode, setViewMode]         = useState<'cards' | 'list' | 'compact'>('cards');
  const [viewOpen, setViewOpen]         = useState(false);

  // Auto-select job from URL ?id= param (e.g. coming from dashboard)
  useEffect(() => {
    if (typeof window === 'undefined' || jobs.length === 0) return;
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) {
      const job = jobs.find((j) => j._id === id);
      if (job) setSelectedJob(job);
    }
  }, [jobs]);

  const handleSeedJobs = async () => {
    setSeeding(true);
    await fetch('/api/dev/seed', { method: 'POST' });
    await dispatch(fetchJobs());
    setSeeding(false);
  };

  useEffect(() => { dispatch(fetchJobs()); }, [dispatch]);

  // Close view dropdown on outside click
  useEffect(() => {
    if (!viewOpen) return;
    const close = () => setViewOpen(false);
    document.addEventListener('click', close, { once: true });
    return () => document.removeEventListener('click', close);
  }, [viewOpen]);

  const openCreate = () => router.push('/jobs/new');
  const openEdit = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTarget(job);
    setForm({
      title: job.title, department: job.department, description: job.description,
      location: job.location || 'Remote',
      skillInput: '', requiredSkills: [...job.requiredSkills],
      niceInput: '', niceToHaveSkills: [...(job.niceToHaveSkills ?? [])],
      experienceYears: job.experienceYears, educationRequired: job.educationRequired || 'Any',
      shortlistTarget: job.shortlistTarget,
    });
    setShowForm(true);
  };

  const addSkill = () => {
    const s = form.skillInput.trim();
    if (s && !form.requiredSkills.includes(s))
      setForm((f) => ({ ...f, requiredSkills: [...f.requiredSkills, s], skillInput: '' }));
  };
  const removeSkill = (sk: string) =>
    setForm((f) => ({ ...f, requiredSkills: f.requiredSkills.filter((s) => s !== sk) }));

  const addNice = () => {
    const s = form.niceInput.trim();
    if (s && !form.niceToHaveSkills.includes(s))
      setForm((f) => ({ ...f, niceToHaveSkills: [...f.niceToHaveSkills, s], niceInput: '' }));
  };
  const removeNice = (sk: string) =>
    setForm((f) => ({ ...f, niceToHaveSkills: f.niceToHaveSkills.filter((s) => s !== sk) }));

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
    const healthPct = Math.min(99, Math.max(60, selectedJob.applicantCount > 0 ? 78 + Math.round(Math.random() * 15) : 0));

    return (
      <div className="max-w-2xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#45464d] font-semibold uppercase tracking-wide mb-4">
          <button onClick={() => setSelectedJob(null)} className="flex items-center gap-1 hover:text-[#0f172a] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Jobs
          </button>
          <ChevronRight className="w-3 h-3 text-[#c6c6cd]" />
          <span className="text-[#76777d]">{selectedJob.department}</span>
          <ChevronRight className="w-3 h-3 text-[#c6c6cd]" />
          <span className="text-[#76777d]">Requirements</span>
        </div>

        {/* Job Header Card */}
        <div className="card mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold text-[#191c1e] leading-tight">{selectedJob.title}</h1>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wide whitespace-nowrap flex-shrink-0 ${STATUS_CLS[selectedJob.status]}`}>
              {STATUS_LABEL[selectedJob.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#45464d]">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#76777d]" />
              {selectedJob.department} · {selectedJob.location || 'Remote'}
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#76777d]" />
              Competitive
            </span>
          </div>
        </div>

        {/* Job Description */}
        {selectedJob.description && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">DETAILED JOB DESCRIPTION</p>
              <button onClick={(e) => openEdit(selectedJob, e)} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <Pencil className="w-3 h-3" /> Edit Requirements
              </button>
            </div>
            <div className="text-sm text-[#45464d] leading-relaxed whitespace-pre-wrap">{selectedJob.description}</div>
          </div>
        )}

        {/* Core Criteria */}
        <div className="card mb-4">
          <p className="section-label mb-4">CORE CRITERIA</p>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#76777d] mb-1.5">Experience Level</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#f2f4f6] flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-[#45464d]" />
                </div>
                <div>
                  <p className="font-bold text-[#191c1e]">{selectedJob.experienceYears}+ Years</p>
                  <p className="text-xs text-[#76777d]">Industry experience</p>
                </div>
              </div>
            </div>
            <div className="h-px bg-[#f2f4f6]" />
            <div>
              <p className="text-xs text-[#76777d] mb-1.5">Education Required</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#f2f4f6] flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-[#45464d]" />
                </div>
                <div>
                  <p className="font-bold text-[#191c1e]">{selectedJob.educationRequired || 'Any'}</p>
                  <p className="text-xs text-[#76777d]">Minimum education level</p>
                </div>
              </div>
            </div>
            <div className="h-px bg-[#f2f4f6]" />
            <div>
              <p className="text-xs text-[#76777d] mb-1.5">Target Shortlist</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#f2f4f6] flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-[#45464d]" />
                </div>
                <div>
                  <p className="font-bold text-[#191c1e]">Top {selectedJob.shortlistTarget}</p>
                  <p className="text-xs text-[#76777d]">Candidates to shortlist</p>
                </div>
              </div>
            </div>
            <div className="h-px bg-[#f2f4f6]" />
            <div>
              <p className="text-xs text-[#76777d] mb-1.5">Work Authorization</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-[#16a34a]" />
                </div>
                <p className="font-semibold text-[#191c1e] text-sm">Open to all candidates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Skills */}
        <div className="card mb-4">
          <p className="section-label mb-4">TECHNICAL SKILLS</p>
          {mustHave.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-[#76777d] mb-2">Must-Have</p>
              <div className="flex flex-wrap gap-2">
                {mustHave.map((s) => <span key={s} className="skill-must">{s.toUpperCase()}</span>)}
              </div>
            </div>
          )}
          {niceToHave.length > 0 && (
            <div>
              <p className="text-xs text-[#76777d] mb-2">Nice-to-Have</p>
              <div className="flex flex-wrap gap-2">
                {niceToHave.map((s) => <span key={s} className="skill-nice">{s.toUpperCase()}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Shortlist Health */}
        {selectedJob.applicantCount > 0 && (
          <div className="card mb-4 bg-[#f7f9fb]">
            <p className="section-label mb-2">SHORTLIST HEALTH</p>
            <p className="text-4xl font-bold text-[#191c1e] mb-1">{healthPct}%</p>
            <p className="text-xs text-[#76777d] mb-3">Candidate match density for this criteria set.</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`flex-1 rounded-sm ${i < Math.round(healthPct / 20) ? 'bg-[#0f172a]' : 'bg-[#e6e8ea]'}`} style={{ height: `${12 + i * 4}px` }} />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href="/applicants" onClick={() => dispatch(selectJob(selectedJob))} className="flex-1">
            <button className="btn-secondary w-full justify-center py-3">
              <Upload className="w-4 h-4" /> Upload Candidates
            </button>
          </Link>
          {(selectedJob.status === 'active' || selectedJob.status === 'screening') && selectedJob.applicantCount > 0 && (
            <Link href="/screening" onClick={() => dispatch(selectJob(selectedJob))} className="flex-1">
              <button className="btn-primary w-full justify-center py-3">
                <Cpu className="w-4 h-4" /> Run Screening
              </button>
            </Link>
          )}
          {selectedJob.status === 'completed' && (
            <Link href="/shortlist" onClick={() => dispatch(selectJob(selectedJob))} className="flex-1">
              <button className="w-full justify-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4" /> Review Candidates ({selectedJob.applicantCount})
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  /* ── Job List View ── */
  return (
    <div className="max-w-3xl lg:max-w-none space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1e]">Jobs</h1>
          <p className="text-[#45464d] text-sm mt-0.5">{jobs.length} posting{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View format dropdown */}
          <div className="relative">
            <button
              onClick={() => setViewOpen((v) => !v)}
              className="btn-secondary !py-2 !px-3 !text-xs flex items-center gap-1.5"
            >
              {viewMode === 'cards'   && <LayoutGrid  className="w-3.5 h-3.5" />}
              {viewMode === 'list'    && <List         className="w-3.5 h-3.5" />}
              {viewMode === 'compact' && <AlignJustify className="w-3.5 h-3.5" />}
              View
              <ChevronDown className="w-3 h-3" />
            </button>
            {viewOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-[#e6e8ea] rounded-lg shadow-lg py-1 w-44">
                {([
                  { key: 'cards'   as const, Icon: LayoutGrid,   label: 'Cards'   },
                  { key: 'list'    as const, Icon: List,          label: 'List'    },
                  { key: 'compact' as const, Icon: AlignJustify,  label: 'Compact' },
                ] as const).map(({ key, Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => { setViewMode(key); setViewOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${viewMode === key ? 'bg-[#f2f4f6] text-[#191c1e] font-semibold' : 'text-[#45464d] hover:bg-[#f7f9fb]'}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSeedJobs}
            disabled={seeding}
            className="btn-secondary !py-2 !px-3 !text-xs"
            title="Add 10 diverse sample job postings"
          >
            {seeding ? (
              <><div className="w-3.5 h-3.5 border-2 border-[#76777d] border-t-transparent rounded-full animate-spin" /> Loading…</>
            ) : (
              <><Plus className="w-3.5 h-3.5" /> Load Sample Jobs</>
            )}
          </button>
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Post New Job
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">{error}</div>}

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-[#f2f4f6] rounded-md p-1 w-fit">
        {ALL_STATUSES.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${
              statusFilter === s ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#45464d] hover:text-[#191c1e]'
            }`}>
            {s === 'all' ? `All (${jobs.length})` : `${s === 'active' ? 'Active' : s === 'screening' ? 'Screening' : 'Completed'} (${counts[s as keyof typeof counts]})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
        <input className="input pl-10" placeholder="Search by title or department…" value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Jobs list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-28 animate-pulse bg-[#eceef0]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-[#c6c6cd]" />
          </div>
          <p className="font-semibold text-[#45464d]">{jobs.length === 0 ? 'No job postings yet' : 'No jobs match your filter'}</p>
          {jobs.length === 0 && (
            <button className="btn-primary mt-4 mx-auto" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Create your first job
            </button>
          )}
        </div>
      ) : viewMode === 'compact' ? (
        /* ── Compact (table rows) ── */
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f9fb] border-b border-[#e6e8ea]">
              <tr>
                {['Title', 'Department', 'Skills', 'Applicants', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#76777d] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {filtered.map((job) => (
                <tr key={job._id} onClick={() => setSelectedJob(job)} className="hover:bg-[#f7f9fb] cursor-pointer group transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-[#191c1e] text-[13px] whitespace-nowrap">{job.title}</p>
                    <p className="text-[11px] text-[#76777d]">{job.experienceYears}+ yrs exp</p>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-[#45464d] whitespace-nowrap">{job.department}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                      {job.requiredSkills.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] bg-[#f2f4f6] text-[#45464d] px-1.5 py-0.5 rounded uppercase font-semibold">{s}</span>
                      ))}
                      {job.requiredSkills.length > 3 && <span className="text-[10px] text-[#76777d]">+{job.requiredSkills.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] font-semibold text-[#191c1e] whitespace-nowrap">{job.applicantCount}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide whitespace-nowrap ${STATUS_CLS[job.status]}`}>
                      {STATUS_LABEL[job.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => openEdit(job, e)} className="p-1 rounded text-[#76777d] hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteId(job._id); }} className="p-1 rounded text-[#76777d] hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-[#c6c6cd]" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'list' ? (
        /* ── List (compact cards) ── */
        <div className="space-y-1.5">
          {filtered.map((job) => (
            <div key={job._id} onClick={() => setSelectedJob(job)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedJob(job); }}
              className="card w-full text-left hover:border-[#c6c6cd] hover:shadow-sm transition-all px-4 py-3 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#191c1e] text-[13px]">{job.title}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${STATUS_CLS[job.status]}`}>
                      {STATUS_LABEL[job.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#76777d]">
                    <span>{job.department}</span>
                    <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {job.applicantCount}</span>
                    <span>{job.experienceYears}+ yrs</span>
                    <span className="hidden sm:flex gap-1">
                      {job.requiredSkills.slice(0, 3).map((s) => (
                        <span key={s} className="bg-[#f2f4f6] text-[#45464d] px-1.5 py-0.5 rounded uppercase font-semibold text-[10px]">{s}</span>
                      ))}
                      {job.requiredSkills.length > 3 && <span className="text-[#76777d]">+{job.requiredSkills.length - 3}</span>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={(e) => openEdit(job, e)} className="p-1.5 rounded text-[#76777d] hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(job._id); }} className="p-1.5 rounded text-[#76777d] hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-[#c6c6cd] ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Cards (default) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((job) => (
            <div key={job._id} onClick={() => setSelectedJob(job)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedJob(job); }}
              className="card w-full text-left hover:border-[#c6c6cd] hover:shadow-sm transition-all p-4 cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-[#191c1e]">{job.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${STATUS_CLS[job.status]}`}>
                      {STATUS_LABEL[job.status]}
                    </span>
                  </div>
                  <p className="text-xs text-[#45464d]">{job.department}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-[#76777d]">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.applicantCount} applicants</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span>{job.experienceYears}+ yrs exp</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.requiredSkills.slice(0, 4).map((s) => (
                      <span key={s} className="text-[10px] bg-[#f2f4f6] text-[#45464d] px-2 py-0.5 rounded uppercase font-semibold tracking-wide">{s}</span>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <span className="text-[10px] text-[#76777d]">+{job.requiredSkills.length - 4}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={(e) => openEdit(job, e)} className="p-1.5 rounded text-[#76777d] hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(job._id); }} className="p-1.5 rounded text-[#76777d] hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-[#c6c6cd] ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showForm && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#e6e8ea]">
              <h2 className="font-bold text-[#191c1e]">Edit Job</h2>
              <button onClick={() => setShowForm(false)} className="text-[#76777d] hover:text-[#191c1e] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Job Title *</label>
                <input className="input" placeholder="e.g. Senior Software Engineer" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Department *</label>
                <input className="input" placeholder="e.g. Engineering" value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" placeholder="e.g. Remote, Kigali, Nairobi" value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={4} placeholder="Role description and responsibilities…"
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Required Skills *</label>
                <div className="flex gap-2">
                  <input className="input" placeholder="Type a skill and press Enter"
                    value={form.skillInput}
                    onChange={(e) => setForm((f) => ({ ...f, skillInput: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                  <button type="button" onClick={addSkill} className="btn-secondary !px-3 flex-shrink-0">Add</button>
                </div>
                {form.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.requiredSkills.map((s) => (
                      <span key={s} className="flex items-center gap-1 bg-[#0f172a] text-white text-xs px-2.5 py-1 rounded font-medium">
                        {s} <button type="button" onClick={() => removeSkill(s)}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="label">Nice-to-Have Skills</label>
                <div className="flex gap-2">
                  <input className="input" placeholder="Optional skills (bonus)"
                    value={form.niceInput}
                    onChange={(e) => setForm((f) => ({ ...f, niceInput: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNice(); } }} />
                  <button type="button" onClick={addNice} className="btn-secondary !px-3 flex-shrink-0">Add</button>
                </div>
                {form.niceToHaveSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.niceToHaveSkills.map((s) => (
                      <span key={s} className="flex items-center gap-1 bg-[#f2f4f6] text-[#45464d] border border-[#e6e8ea] text-xs px-2.5 py-1 rounded font-medium">
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
                  <select className="input" value={form.educationRequired}
                    onChange={(e) => setForm((f) => ({ ...f, educationRequired: e.target.value }))}>
                    {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Shortlist Target</label>
                <select className="input" value={form.shortlistTarget}
                  onChange={(e) => setForm((f) => ({ ...f, shortlistTarget: Number(e.target.value) as 10 | 20 }))}>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                </select>
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

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#191c1e]">Delete Job?</h3>
                <p className="text-sm text-[#45464d] mt-1">
                  This permanently deletes the job, all applicants, and screening results. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 justify-center">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* eslint-disable-next-line */
function Briefcase({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}
