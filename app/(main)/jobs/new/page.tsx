'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { createJob } from '@/store/slices/jobsSlice';
import { ArrowLeft, Plus, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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

export default function NewJobPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    if (!form.title || !form.department || form.requiredSkills.length === 0) return;
    setSaving(true);
    setError('');
    const result = await dispatch(createJob({
      title: form.title, department: form.department, description: form.description,
      location: form.location || 'Remote',
      requiredSkills: form.requiredSkills, niceToHaveSkills: form.niceToHaveSkills,
      experienceYears: form.experienceYears, educationRequired: form.educationRequired,
      shortlistTarget: form.shortlistTarget,
    }));
    setSaving(false);
    if (createJob.rejected.match(result)) {
      setError(String(result.payload) || 'Failed to create job');
    } else {
      router.push('/jobs');
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#45464d] font-semibold uppercase tracking-wide mb-5">
        <Link href="/jobs" className="flex items-center gap-1 hover:text-[#0f172a] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Jobs
        </Link>
        <ChevronRight className="w-3 h-3 text-[#c6c6cd]" />
        <span className="text-[#76777d]">New Posting</span>
      </div>

      <h1 className="text-2xl font-bold text-[#191c1e] mb-1">Post a New Job</h1>
      <p className="text-sm text-[#45464d] mb-6">Fill in the role details and required skills for AI screening.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Details card */}
        <div className="card space-y-4">
          <p className="section-label">ROLE DETAILS</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="e.g. Remote, Kigali, Nairobi" value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={5} placeholder="Role description, responsibilities, and expectations…"
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>

        {/* Skills & Experience card */}
        <div className="card space-y-4">
          <p className="section-label">SKILLS & EXPERIENCE</p>

          <div>
            <label className="label">Required Skills *</label>
            <div className="flex gap-2">
              <input className="input" placeholder="Type a skill and press Enter or click Add"
                value={form.skillInput}
                onChange={(e) => setForm((f) => ({ ...f, skillInput: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
              <button type="button" onClick={addSkill} className="btn-secondary !px-4 flex-shrink-0">Add</button>
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
              <input className="input" placeholder="Optional skills (bonus for candidates)"
                value={form.niceInput}
                onChange={(e) => setForm((f) => ({ ...f, niceInput: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNice(); } }} />
              <button type="button" onClick={addNice} className="btn-secondary !px-4 flex-shrink-0">Add</button>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min Experience (years)</label>
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
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Link href="/jobs" className="flex-1">
            <button type="button" className="btn-secondary w-full justify-center py-3">Cancel</button>
          </Link>
          <button
            type="submit"
            disabled={saving || !form.title || !form.department || form.requiredSkills.length === 0}
            className="btn-primary flex-1 justify-center py-3"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</>
            ) : (
              <><Plus className="w-4 h-4" /> Post Job</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
