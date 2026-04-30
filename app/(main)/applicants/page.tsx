'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchJobs, selectJob } from '@/store/slices/jobsSlice';
import {
  Upload, FileText, Users, CheckCircle, AlertCircle,
  ChevronDown, Trash2, RefreshCw, User, MapPin,
  X, Loader2, Plus, Search,
} from 'lucide-react';
import type { Job, TalentProfile } from '@/types';

type Tab = 'PDF / CV' | 'CSV';
const TABS: Tab[] = ['PDF / CV', 'CSV'];

interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  inserted?: number;
  error?: string;
}

const SOURCE_CLS: Record<string, string> = {
  csv:     'bg-blue-50 text-blue-700',
  pdf:     'bg-purple-50 text-purple-700',
  umurava: 'bg-emerald-50 text-emerald-700',
};

/* ── Searchable Job Dropdown ── */
function SearchableJobSelect({
  jobs,
  selectedJob,
  onChange,
}: {
  jobs: Job[];
  selectedJob: Job | null;
  onChange: (job: Job | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = jobs.filter((j) =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.department.toLowerCase().includes(search.toLowerCase())
  );

  const displayValue = selectedJob && !open
    ? `${selectedJob.title} (${selectedJob.department}) · ${selectedJob.applicantCount} candidates`
    : search;

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d] pointer-events-none" />
        <input
          value={displayValue}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); if (selectedJob) setSearch(''); }}
          placeholder="Search and select a job posting…"
          className="input pl-10 pr-10 cursor-pointer"
        />
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d] pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-[#e6e8ea] rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#76777d]">No jobs match "{search}"</div>
          ) : (
            filtered.map((job) => (
              <button
                key={job._id}
                onClick={() => { onChange(job); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-3 hover:bg-[#f7f9fb] transition-colors border-b border-[#f2f4f6] last:border-0 ${
                  selectedJob?._id === job._id ? 'bg-[#f0f9ff]' : ''
                }`}
              >
                <p className="font-semibold text-[#191c1e] text-sm">{job.title}</p>
                <p className="text-[11px] text-[#76777d] mt-0.5">
                  {job.department} · {job.applicantCount} candidate{job.applicantCount !== 1 ? 's' : ''} · {job.status}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Reusable file queue drop zone ── */
function FileQueue({
  accept,
  multiple,
  dragColor,
  icon: Icon,
  label,
  sublabel,
  queue,
  uploading,
  onAddFiles,
  onRemove,
  onUpload,
}: {
  accept: string;
  multiple: boolean;
  dragColor: string;
  icon: React.ElementType;
  label: string;
  sublabel: string;
  queue: FileItem[];
  uploading: boolean;
  onAddFiles: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  onUpload: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const pendingCount  = queue.filter((f) => f.status === 'pending').length;
  const doneCount     = queue.filter((f) => f.status === 'done').length;
  const insertedTotal = queue.filter((f) => f.status === 'done').reduce((s, f) => s + (f.inserted ?? 0), 0);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onAddFiles(e.dataTransfer.files); }}
        onClick={() => !uploading && ref.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-colors ${
          drag ? dragColor : 'border-[#e6e8ea] hover:border-[#c6c6cd] hover:bg-[#f7f9fb]'
        } ${uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
      >
        <Icon className="w-10 h-10 text-[#c6c6cd] mx-auto mb-3" />
        <p className="font-semibold text-[#45464d] text-sm sm:text-base">{label}</p>
        <p className="text-xs sm:text-sm text-[#76777d] mt-1">{sublabel}</p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
          className="btn-secondary mt-4 mx-auto !text-xs !py-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Browse Files
        </button>
        <input
          ref={ref}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => { if (e.target.files) onAddFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {queue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#45464d] uppercase tracking-wide">
              {queue.length} file{queue.length !== 1 ? 's' : ''} queued
              {doneCount > 0 && ` · ${insertedTotal} candidate${insertedTotal !== 1 ? 's' : ''} extracted`}
            </p>
            {!uploading && (
              <button onClick={() => queue.forEach((f) => onRemove(f.id))} className="text-xs text-[#76777d] hover:text-red-600 transition-colors">
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                  item.status === 'done'      ? 'bg-emerald-50 border-emerald-200' :
                  item.status === 'error'     ? 'bg-red-50 border-red-200' :
                  item.status === 'uploading' ? 'bg-blue-50 border-blue-200' :
                  'bg-[#f7f9fb] border-[#e6e8ea]'
                }`}
              >
                <div className="flex-shrink-0">
                  {item.status === 'uploading' && <Loader2    className="w-4 h-4 text-blue-500 animate-spin" />}
                  {item.status === 'done'      && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  {item.status === 'error'     && <AlertCircle className="w-4 h-4 text-red-500" />}
                  {item.status === 'pending'   && <FileText    className="w-4 h-4 text-[#76777d]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#191c1e] truncate">{item.file.name}</p>
                  <p className="text-[11px] text-[#76777d]">
                    {item.status === 'pending'   && `${(item.file.size / 1024).toFixed(0)} KB · waiting`}
                    {item.status === 'uploading' && 'Gemini is reading and extracting profile…'}
                    {item.status === 'done'      && `${item.inserted} candidate${item.inserted !== 1 ? 's' : ''} extracted`}
                    {item.status === 'error'     && (item.error || 'Upload failed')}
                  </p>
                </div>
                {item.status === 'pending' && !uploading && (
                  <button onClick={() => onRemove(item.id)} className="p-1 rounded text-[#76777d] hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {pendingCount > 0 && (
            <button onClick={onUpload} disabled={uploading} className="btn-primary w-full justify-center py-3">
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading — Gemini extracting profiles…</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload {pendingCount} File{pendingCount !== 1 ? 's' : ''}</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function ApplicantsPage() {
  const dispatch = useAppDispatch();
  const { items: jobs, selected: selectedJob } = useAppSelector((s) => s.jobs);

  const [tab,       setTab]       = useState<Tab>('PDF / CV');
  const [pdfQueue,  setPdfQueue]  = useState<FileItem[]>([]);
  const [csvQueue,  setCsvQueue]  = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const [applicants,    setApplicants]    = useState<TalentProfile[]>([]);
  const [listLoading,   setListLoading]   = useState(false);
  const [listPage,      setListPage]      = useState(1);
  const [listTotal,     setListTotal]     = useState(0);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [deletingAll,   setDeletingAll]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const LIMIT = 10;
  const API   = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => { dispatch(fetchJobs()); }, [dispatch]);

  const loadApplicants = useCallback(async (jobId: string, page = 1) => {
    setListLoading(true);
    try {
      const res = await fetch(`${API}/api/applicants?jobId=${jobId}&page=${page}&limit=${LIMIT}`);
      if (res.ok) {
        const data = await res.json();
        setApplicants(data.applicants);
        setListTotal(data.total);
        setListPage(page);
      }
    } finally { setListLoading(false); }
  }, [API]);

  useEffect(() => {
    if (selectedJob) { setApplicants([]); loadApplicants(selectedJob._id, 1); }
    else             { setApplicants([]); setListTotal(0); }
  }, [selectedJob, loadApplicants]);

  const makeAdder = (accept: RegExp, setter: React.Dispatch<React.SetStateAction<FileItem[]>>) =>
    (incoming: FileList | File[]) => {
      const items: FileItem[] = Array.from(incoming)
        .filter((f) => accept.test(f.name))
        .map((f) => ({ id: `${f.name}-${Date.now()}-${Math.random()}`, file: f, status: 'pending' }));
      setter((q) => [...q, ...items]);
    };

  const addPdfFiles = makeAdder(/\.pdf$/i, setPdfQueue);
  const addCsvFiles = makeAdder(/\.(csv)$/i, setCsvQueue);

  const uploadQueue = async (queue: FileItem[], setter: React.Dispatch<React.SetStateAction<FileItem[]>>) => {
    if (!selectedJob) return;
    const pending = queue.filter((f) => f.status === 'pending');
    if (pending.length === 0) return;

    setUploading(true);
    for (const item of pending) {
      setter((q) => q.map((f) => f.id === item.id ? { ...f, status: 'uploading' } : f));
      const fd = new FormData();
      fd.append('file', item.file);
      fd.append('jobId', selectedJob._id);
      const res  = await fetch(`${API}/api/applicants/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setter((q) => q.map((f) => f.id === item.id ? { ...f, status: 'done', inserted: data.inserted } : f));
      } else {
        setter((q) => q.map((f) => f.id === item.id ? { ...f, status: 'error', error: data.message || 'Upload failed' } : f));
      }
    }
    setUploading(false);
    await dispatch(fetchJobs());
    if (selectedJob) loadApplicants(selectedJob._id, 1);
  };

  const handleRemove = (setter: React.Dispatch<React.SetStateAction<FileItem[]>>) =>
    (id: string) => { if (!uploading) setter((q) => q.filter((f) => f.id !== id)); };

  const handleDelete = async (id: string) => {
    if (!selectedJob) return;
    setDeletingId(id);
    await fetch(`${API}/api/applicants/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    await dispatch(fetchJobs());
    loadApplicants(selectedJob._id, listPage);
  };

  const handleDeleteAll = async () => {
    if (!selectedJob) return;
    setDeletingAll(true);
    setConfirmDelete(false);
    await fetch(`${API}/api/applicants?jobId=${selectedJob._id}`, { method: 'DELETE' });
    setDeletingAll(false);
    setApplicants([]);
    setListTotal(0);
    await dispatch(fetchJobs());
  };

  const totalPages = Math.ceil(listTotal / LIMIT);

  return (
    <div className="max-w-full space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#191c1e]">Candidates</h1>
        <p className="text-[#45464d] text-sm mt-0.5 hidden sm:block">
          Upload CVs or a CSV — Gemini AI extracts every candidate's profile automatically
        </p>
      </div>

      {/* Job selector */}
      <div className="card">
        <label className="label">Select Job *</label>
        <SearchableJobSelect
          jobs={jobs}
          selectedJob={selectedJob}
          onChange={(job) => dispatch(selectJob(job ?? null))}
        />
        {selectedJob && (
          <p className="text-xs text-[#76777d] mt-2">
            {selectedJob.applicantCount} uploaded · Target: Top {selectedJob.shortlistTarget}
          </p>
        )}
      </div>

      {/* Upload card */}
      <div className="card space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#f2f4f6] rounded-md p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 sm:px-4 py-2 rounded text-sm font-medium transition-colors ${
                tab === t ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#45464d] hover:text-[#191c1e]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'PDF / CV' && (
          <FileQueue
            accept=".pdf"
            multiple
            dragColor="border-purple-400 bg-purple-50"
            icon={FileText}
            label="Drop PDF resumes / CVs here"
            sublabel="Select multiple CVs at once · Gemini reads each resume and extracts all candidate info"
            queue={pdfQueue}
            uploading={uploading}
            onAddFiles={addPdfFiles}
            onRemove={handleRemove(setPdfQueue)}
            onUpload={() => uploadQueue(pdfQueue, setPdfQueue)}
          />
        )}

        {tab === 'CSV' && (
          <FileQueue
            accept=".csv"
            multiple
            dragColor="border-blue-400 bg-blue-50"
            icon={Upload}
            label="Drop your CSV candidate file here"
            sublabel="Any column layout accepted · Gemini reads headers and maps each row to a structured profile"
            queue={csvQueue}
            uploading={uploading}
            onAddFiles={addCsvFiles}
            onRemove={handleRemove(setCsvQueue)}
            onUpload={() => uploadQueue(csvQueue, setCsvQueue)}
          />
        )}

        {!selectedJob && (pdfQueue.some((f) => f.status === 'pending') || csvQueue.some((f) => f.status === 'pending')) && (
          <p className="text-xs text-amber-600 text-center">Select a job above before uploading</p>
        )}
      </div>

      {/* Applicants Table */}
      {selectedJob && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#191c1e]">Uploaded Candidates</h2>
              <p className="text-xs text-[#76777d] mt-0.5">
                {listTotal} candidate{listTotal !== 1 ? 's' : ''} for {selectedJob.title}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadApplicants(selectedJob._id, listPage)} className="btn-secondary !py-1.5 !px-3 !text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              {listTotal > 0 && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={deletingAll}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                >
                  {deletingAll
                    ? <><div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> Deleting…</>
                    : <><Trash2 className="w-3.5 h-3.5" /> Delete All</>
                  }
                </button>
              )}
            </div>
          </div>

          {listLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-[#f2f4f6] animate-pulse" />)}
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-12 bg-[#f7f9fb] rounded-xl">
              <User className="w-10 h-10 text-[#e6e8ea] mx-auto mb-2" />
              <p className="text-[#76777d] text-sm font-medium">No candidates uploaded yet</p>
              <p className="text-[#c6c6cd] text-xs mt-1">Upload CVs above — Gemini extracts all info automatically</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {applicants.map((a, idx) => {
                  const displayName  = a.name || [a.firstName, a.lastName].filter(Boolean).join(' ') || 'Unknown';
                  const displayRole  = a.currentRole || a.headline || '—';
                  const displayLoc   = a.location && a.location !== 'Not specified' && a.location !== '—' ? a.location : null;
                  return (
                    <div key={a._id} className="bg-[#f7f9fb] rounded-xl p-3 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold">
                        {(listPage - 1) * LIMIT + idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#191c1e] text-sm">{displayName}</p>
                        <p className="text-xs text-[#45464d] truncate">{displayRole}</p>
                        {displayLoc && <p className="text-[11px] text-[#76777d] flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{displayLoc}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(a._id)}
                        disabled={deletingId === a._id}
                        className="p-1.5 rounded-lg text-[#76777d] hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                      >
                        {deletingId === a._id
                          ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto border border-[#f2f4f6] rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-[#f7f9fb] border-b border-[#e6e8ea]">
                    <tr>
                      {['#', 'Name', 'Location', 'Email', 'Role / Title', 'Skills', 'Exp', 'Source', ''].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#76777d] uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f7f9fb]">
                    {applicants.map((a, idx) => {
                      const displayName  = a.name || [a.firstName, a.lastName].filter(Boolean).join(' ') || 'Unknown';
                      const displayRole  = a.currentRole || (a.headline !== 'PDF Upload' ? a.headline : null) || '—';
                      const displayLoc   = a.location && a.location !== 'Not specified' ? a.location : '—';
                      const displayEmail = a.email && !a.email.includes('@placeholder') ? a.email : '—';
                      return (
                        <tr key={a._id} className="hover:bg-[#f7f9fb]">
                          <td className="px-4 py-3 text-[#76777d] text-xs w-10">{(listPage - 1) * LIMIT + idx + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="font-semibold text-[#191c1e] text-sm">{displayName}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {displayLoc !== '—' ? (
                              <span className="flex items-center gap-1 text-xs text-[#45464d]">
                                <MapPin className="w-3 h-3 text-[#76777d] flex-shrink-0" />{displayLoc}
                              </span>
                            ) : <span className="text-xs text-[#c6c6cd]">—</span>}
                          </td>
                          <td className="px-4 py-3 text-[#45464d] text-xs whitespace-nowrap">{displayEmail}</td>
                          <td className="px-4 py-3 text-[#45464d] text-xs whitespace-nowrap">{displayRole}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap max-w-[160px]">
                              {a.skills.slice(0, 3).map((s, si) => {
                                const name = typeof s === 'string' ? s : s.name;
                                return (
                                  <span key={name || si} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">{name}</span>
                                );
                              })}
                              {a.skills.length > 3 && <span className="text-[10px] text-[#76777d]">+{a.skills.length - 3}</span>}
                              {a.skills.length === 0 && <span className="text-[10px] text-[#c6c6cd] italic">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#45464d] text-xs whitespace-nowrap">
                            {a.experienceYears > 0 ? `${a.experienceYears}y` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_CLS[a.source] || 'bg-[#f2f4f6] text-[#45464d]'}`}>
                              {a.source}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDelete(a._id)}
                              disabled={deletingId === a._id}
                              className="p-1.5 rounded-lg text-[#76777d] hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              {deletingId === a._id
                                ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-[#76777d]">
                    Showing {(listPage - 1) * LIMIT + 1}–{Math.min(listPage * LIMIT, listTotal)} of {listTotal}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => loadApplicants(selectedJob._id, listPage - 1)} disabled={listPage <= 1}
                      className="btn-secondary !py-1 !px-3 !text-xs disabled:opacity-40">← Prev</button>
                    <span className="px-3 py-1 text-xs text-[#45464d] font-medium">{listPage} / {totalPages}</span>
                    <button onClick={() => loadApplicants(selectedJob._id, listPage + 1)} disabled={listPage >= totalPages}
                      className="btn-secondary !py-1 !px-3 !text-xs disabled:opacity-40">Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#191c1e] mb-1">Delete all candidates?</h3>
                <p className="text-sm text-[#45464d] leading-relaxed">
                  This will permanently delete all {listTotal} candidate{listTotal !== 1 ? 's' : ''} and screening results for <strong>{selectedJob?.title}</strong>. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleDeleteAll}
                className="flex-1 justify-center flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors">
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
