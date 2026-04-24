'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchJobs } from '@/store/slices/jobsSlice';
import { fetchShortlist, clearScreening, clearError } from '@/store/slices/screeningSlice';
import {
  Download, AlertCircle, Loader2, ArrowLeft, ChevronRight,
  MapPin, Mail, Phone, Briefcase, GraduationCap, Award, Globe,
  Github, Linkedin, ExternalLink, Clock, CheckCircle2, AlertTriangle, MoreVertical,
} from 'lucide-react';
import ScoreBar from '@/components/ScoreBar';
import type { Job, TalentProfile } from '@/types';
import type { PopulatedResult } from '@/store/slices/screeningSlice';

/* ── helpers ── */
function scoreColor(s: number) {
  if (s >= 90) return 'bg-[#16a34a]';
  if (s >= 80) return 'bg-[#22c55e]';
  if (s >= 70) return 'bg-[#f59e0b]';
  if (s >= 60) return 'bg-[#f97316]';
  return 'bg-[#ef4444]';
}

function fitLabel(suggestion: string) {
  if (suggestion === 'Strong Yes') return { label: 'HIGH MATCH',  cls: 'fit-high-match' };
  if (suggestion === 'Yes')        return { label: 'STRONG FIT',  cls: 'fit-strong-fit' };
  if (suggestion === 'Maybe')      return { label: 'GOOD FIT',    cls: 'fit-good-fit'   };
  return                                  { label: 'LOW FIT',     cls: 'fit-low-fit'    };
}

function recommendationBadge(suggestion: string) {
  if (suggestion === 'Strong Yes') return 'HIGHLY RECOMMENDED';
  if (suggestion === 'Yes')        return 'RECOMMENDED';
  if (suggestion === 'Maybe')      return 'POSSIBLE MATCH';
  return 'NOT RECOMMENDED';
}

function DonutChart({ pct, size = 100 }: { pct: number; size?: number }) {
  const r = (size / 2) * 0.78;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e6e8ea" strokeWidth={size * 0.1} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#0f172a" strokeWidth={size * 0.1}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
    </svg>
  );
}

/* ── Candidate Deep-Dive ── */
function CandidateProfile({
  result, job, onBack,
}: { result: PopulatedResult; job: Job | null; onBack: () => void }) {
  const talent = result.talent as TalentProfile;
  const [activeTab, setActiveTab] = useState<'experience' | 'projects' | 'resume' | 'education'>('experience');

  const technicalFit = Math.round((result.scoreBreakdown.skills * 0.6 + result.scoreBreakdown.experience * 0.4));
  const culturalAlign = Math.round((result.scoreBreakdown.relevance * 0.7 + result.scoreBreakdown.education * 0.3));
  const { label: recLabel, cls: recCls } = fitLabel(result.hiringSuggestion);
  const badge = recommendationBadge(result.hiringSuggestion);

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#45464d] font-semibold uppercase tracking-wide mb-4">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-[#0f172a] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Candidates
        </button>
        <ChevronRight className="w-3 h-3 text-[#c6c6cd]" />
        <span className="text-[#76777d]">Deep-Dive Analysis</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-5">
        <button className="btn-secondary py-2 rounded-md text-xs font-semibold">
          Save to Shortlist
        </button>
        <button className="btn-primary py-2 rounded-md text-xs font-semibold">
          Schedule Interview
        </button>
      </div>

      {/* Candidate hero card */}
      <div className="card mb-4">
        <div className="flex items-start gap-4">
          {/* Avatar with score */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#1e293b] to-[#334155] flex items-center justify-center text-white font-bold text-xl">
              {talent.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
            </div>
            <div className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-md ${scoreColor(result.matchScore)} flex items-center justify-center`}>
              <span className="text-white text-[10px] font-bold">{result.matchScore}</span>
            </div>
          </div>

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-[#191c1e]">{talent.name}</h1>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wide mb-2">
              <CheckCircle2 className="w-3 h-3" /> {badge}
            </span>
            {talent.headline && (
              <p className="text-sm text-[#45464d] font-medium mt-1">{talent.headline}</p>
            )}
            {talent.currentRole && (
              <p className="text-xs text-[#76777d] mt-0.5">
                <span className="font-semibold">{talent.currentRole}</span>
                {talent.experienceYears ? ` · ${talent.experienceYears}+ Years Experience` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#f2f4f6] text-xs text-[#45464d]">
          {talent.location && (
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#76777d]" />{talent.location}</span>
          )}
          {talent.availability && (
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#76777d]" />
              Notice: {talent.availability.type || talent.availability.status}
            </span>
          )}
          {talent.email && (
            <a href={`mailto:${talent.email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
              <Mail className="w-3.5 h-3.5" />{talent.email}
            </a>
          )}
        </div>
      </div>

      {/* Match Quality Index */}
      <div className="card-dark rounded-lg mb-4">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">Match Quality Index</p>
        <div className="flex items-center gap-4">
          {/* Big score */}
          <div className="flex-shrink-0 relative">
            <DonutChart pct={result.matchScore} size={80} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">{result.matchScore}</span>
              <span className="text-white/40 text-[10px]">%</span>
            </div>
          </div>
          {/* Breakdown bars */}
          <div className="flex-1 space-y-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60 font-medium">Technical Fit</span>
                <span className="text-white font-bold">{technicalFit}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${technicalFit}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60 font-medium">Cultural Alignment</span>
                <span className="text-white font-bold">{culturalAlign}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all duration-700" style={{ width: `${culturalAlign}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Relevance Summary */}
      {result.recommendation && (
        <div className="card mb-4">
          <p className="section-label mb-2">Relevance Summary</p>
          <p className="text-sm text-[#45464d] leading-relaxed">{result.recommendation}</p>
        </div>
      )}

      {/* Strengths & Gaps */}
      <div className="space-y-3 mb-4">
        {/* Key Strengths */}
        {result.strengths?.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="section-label mb-0">Key Strengths</p>
            </div>
            <ul className="space-y-2">
              {result.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#191c1e] leading-tight">{s.split(':')[0]}</p>
                    {s.includes(':') && <p className="text-xs text-[#45464d] mt-0.5">{s.split(':').slice(1).join(':').trim()}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Identified Gaps */}
        {result.gaps?.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="section-label mb-0">Identified Gaps</p>
            </div>
            <ul className="space-y-2">
              {result.gaps.map((g: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${i % 2 === 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-red-500' : 'bg-amber-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#191c1e] leading-tight">{g.split(':')[0]}</p>
                    {g.includes(':') && <p className="text-xs text-[#45464d] mt-0.5">{g.split(':').slice(1).join(':').trim()}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-4 border-b border-[#e6e8ea]">
        {(['experience', 'projects', 'resume', 'education'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[#0f172a] text-[#191c1e]'
                : 'border-transparent text-[#76777d] hover:text-[#45464d]'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'experience' && talent.experience && talent.experience.length > 0 && (
        <div className="space-y-3">
          {talent.experience.map((exp, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="font-bold text-[#191c1e] text-sm">{exp.role}</p>
                  <p className="text-xs font-semibold text-blue-600">{exp.company}</p>
                </div>
                <span className="text-[11px] text-[#76777d] whitespace-nowrap">
                  {exp.startDate} – {exp.endDate || 'Present'}
                </span>
              </div>
              {exp.description && (
                <p className="text-xs text-[#45464d] mt-2 leading-relaxed">{exp.description}</p>
              )}
              {exp.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {exp.technologies.map((t) => (
                    <span key={t} className="text-[10px] bg-[#f2f4f6] text-[#45464d] px-2 py-0.5 rounded uppercase font-semibold tracking-wide">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'experience' && (!talent.experience || talent.experience.length === 0) && (
        <div className="card text-center py-10">
          <Briefcase className="w-8 h-8 text-[#c6c6cd] mx-auto mb-2" />
          <p className="text-sm text-[#76777d]">No experience data available</p>
        </div>
      )}

      {/* Projects tab */}
      {activeTab === 'projects' && talent.projects && talent.projects.length > 0 && (
        <div className="space-y-3">
          {talent.projects.map((proj, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="font-bold text-[#191c1e] text-sm">{proj.name}</p>
                  {proj.role && <p className="text-xs font-semibold text-blue-600">{proj.role}</p>}
                </div>
                {(proj.startDate || proj.endDate) && (
                  <span className="text-[11px] text-[#76777d] whitespace-nowrap">
                    {proj.startDate || ''}
                    {proj.endDate ? ` – ${proj.endDate}` : ''}
                  </span>
                )}
              </div>
              {proj.description && (
                <p className="text-xs text-[#45464d] mt-2 leading-relaxed">{proj.description}</p>
              )}
              {proj.technologies && proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {proj.technologies.map((t) => (
                    <span key={t} className="text-[10px] bg-[#f2f4f6] text-[#45464d] px-2 py-0.5 rounded uppercase font-semibold tracking-wide">{t}</span>
                  ))}
                </div>
              )}
              {proj.link && (
                <a href={proj.link} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
                  <ExternalLink className="w-3 h-3" /> View Project
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'projects' && (!talent.projects || talent.projects.length === 0) && (
        <div className="card text-center py-10">
          <Globe className="w-8 h-8 text-[#c6c6cd] mx-auto mb-2" />
          <p className="text-sm text-[#76777d]">No projects data available</p>
        </div>
      )}

      {activeTab === 'resume' && (
        <div className="card">
          {talent.bio ? (
            <>
              <p className="section-label mb-3">Summary</p>
              <p className="text-sm text-[#45464d] leading-relaxed mb-4">{talent.bio}</p>
            </>
          ) : null}

          {talent.skills && talent.skills.length > 0 && (
            <>
              <p className="section-label mb-3 mt-4">Skills</p>
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill) => {
                  const levelCls =
                    skill.level === 'Expert' ? 'bg-[#f3e8ff] text-[#7c3aed]' :
                    skill.level === 'Advanced' ? 'bg-[#dbeafe] text-[#2563eb]' :
                    skill.level === 'Intermediate' ? 'bg-[#dcfce7] text-[#16a34a]' :
                    'bg-[#f2f4f6] text-[#45464d]';
                  return (
                    <div key={skill.name} className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded ${levelCls}`}>
                      <span>{skill.name}</span>
                      <span className="opacity-50 text-[10px]">· {skill.level}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {talent.certifications && talent.certifications.length > 0 && (
            <>
              <p className="section-label mb-3 mt-5">Certifications</p>
              <div className="flex flex-wrap gap-2">
                {talent.certifications.map((cert, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-100 rounded-md px-3 py-2 text-xs">
                    <p className="font-semibold text-amber-900">{cert.name}</p>
                    {cert.issuer && <p className="text-amber-700 mt-0.5">{cert.issuer}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {talent.languages && talent.languages.length > 0 && (
            <>
              <p className="section-label mb-3 mt-5">Languages</p>
              <div className="flex flex-wrap gap-2">
                {talent.languages.map((lang, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-[#f2f4f6] rounded-md px-3 py-1.5 text-xs">
                    <Globe className="w-3 h-3 text-[#76777d]" />
                    <span className="font-semibold text-[#191c1e]">{lang.name}</span>
                    <span className="text-[#76777d]">· {lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Social links */}
          {talent.socialLinks && Object.values(talent.socialLinks).some(Boolean) && (
            <>
              <p className="section-label mb-3 mt-5">Links</p>
              <div className="flex flex-wrap gap-2">
                {talent.socialLinks.linkedin && (
                  <a href={talent.socialLinks.linkedin} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md font-medium hover:bg-blue-100">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
                {talent.socialLinks.github && (
                  <a href={talent.socialLinks.github} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-[#f2f4f6] text-[#191c1e] px-3 py-1.5 rounded-md font-medium hover:bg-[#e6e8ea]">
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </a>
                )}
                {talent.socialLinks.portfolio && (
                  <a href={talent.socialLinks.portfolio} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-md font-medium hover:bg-emerald-100">
                    <Globe className="w-3.5 h-3.5" /> Portfolio
                  </a>
                )}
                {talent.socialLinks.website && (
                  <a href={talent.socialLinks.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-md font-medium hover:bg-purple-100">
                    <ExternalLink className="w-3.5 h-3.5" /> Website
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'education' && (
        <div className="space-y-3">
          {talent.education && talent.education.length > 0 ? talent.education.map((edu, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-[#f2f4f6] flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-4 h-4 text-[#45464d]" />
                </div>
                <div>
                  <p className="font-bold text-[#191c1e] text-sm">
                    {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                  </p>
                  <p className="text-xs text-[#45464d] mt-0.5">{edu.institution}</p>
                  {(edu.startYear || edu.endYear) && (
                    <p className="text-xs text-[#76777d] mt-0.5">
                      {edu.startYear || ''}–{edu.endYear || 'Present'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="card text-center py-10">
              <GraduationCap className="w-8 h-8 text-[#c6c6cd] mx-auto mb-2" />
              <p className="text-sm text-[#76777d]">No education data available</p>
            </div>
          )}
        </div>
      )}

      {/* Score breakdown */}
      <div className="card mt-4">
        <p className="section-label mb-4">Score Breakdown</p>
        <div className="space-y-3">
          <ScoreBar label="Skills Match"   value={result.scoreBreakdown.skills}     weight="35%" color="bg-[#0f172a]" />
          <ScoreBar label="Experience"     value={result.scoreBreakdown.experience} weight="30%" color="bg-[#334155]" />
          <ScoreBar label="Education"      value={result.scoreBreakdown.education}  weight="20%" color="bg-[#64748b]" />
          <ScoreBar label="Overall Fit"    value={result.scoreBreakdown.relevance}  weight="15%" color="bg-[#94a3b8]" />
        </div>
      </div>
    </div>
  );
}

/* ── Shortlist Page ── */
export default function ShortlistPage() {
  const dispatch = useAppDispatch();
  const { items: jobs } = useAppSelector((s) => s.jobs);
  const { results, error } = useAppSelector((s) => s.screening);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<PopulatedResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { dispatch(fetchJobs()); }, [dispatch]);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) setSelectedJob(jobs[0]);
  }, [jobs, selectedJob]);

  useEffect(() => {
    if (selectedJob) {
      setLoading(true);
      dispatch(fetchShortlist(selectedJob._id)).finally(() => setLoading(false));
    }
  }, [selectedJob, dispatch]);

  const handleExportCSV = () => {
    if (results.length === 0) { alert('No candidates to export'); return; }
    const headers = ['Rank', 'Name', 'Email', 'Headline', 'Location', 'Match Score', 'Hiring Suggestion'];
    const rows = (results as PopulatedResult[]).map((r) => {
      const t = (r.talent ?? {}) as Partial<TalentProfile>;
      return [r.rank, t.name || 'N/A', t.email || 'N/A', t.headline || 'N/A', t.location || 'N/A', r.matchScore, r.hiringSuggestion];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `shortlist_${selectedJob?._id || 'export'}.csv`; a.click();
    window.URL.revokeObjectURL(url);
  };

  /* Show deep-dive if candidate is selected */
  if (selectedCandidate) {
    return (
      <CandidateProfile
        result={selectedCandidate}
        job={selectedJob}
        onBack={() => setSelectedCandidate(null)}
      />
    );
  }

  /* AI market alignment score */
  const alignmentScore = results.length > 0
    ? Math.round(results.reduce((s: number, r: any) => s + r.matchScore, 0) / results.length)
    : 0;

  return (
    <div className="max-w-2xl lg:max-w-3xl space-y-5">
      {/* Header */}
      <div>
        {selectedJob && (
          <p className="text-[11px] text-[#45464d] font-semibold uppercase tracking-wide mb-1.5">
            Jobs › {selectedJob.title}
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Shortlisted Candidates</h1>
            {results.length > 0 && (
              <p className="text-[#45464d] text-sm mt-0.5">
                Found {results.length} candidates matching {selectedJob?.requiredSkills?.length ?? 0} criteria for this role.
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="btn-secondary py-2 !text-xs">
              Filter
            </button>
            <button onClick={handleExportCSV} disabled={results.length === 0} className="btn-secondary py-2 !text-xs">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Job Selector */}
      <div>
        <label className="label">Select Job</label>
        <select value={selectedJob?._id || ''} onChange={(e) => {
            const job = jobs.find((j) => j._id === e.target.value);
            setSelectedJob(job || null);
            dispatch(clearScreening());
          }} className="input">
          <option value="">Choose a job…</option>
          {[...jobs].sort((a, b) => {
            const o = { completed: 0, screening: 1, active: 2 };
            return (o[a.status] ?? 3) - (o[b.status] ?? 3);
          }).map((j) => (
            <option key={j._id} value={j._id}>
              {j.title} · {j.applicantCount} applicants · {j.status}
            </option>
          ))}
        </select>
      </div>

      {/* Spec + Analytics panels */}
      {selectedJob && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Job Specifications */}
          <div className="card">
            <p className="section-label mb-3">Job Specifications</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#76777d] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#191c1e]">Remote / {selectedJob.department}</p>
                  <p className="text-[10px] text-[#76777d] uppercase tracking-wide font-semibold mt-0.5">Location</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-[#76777d] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#191c1e]">{selectedJob.experienceYears}+ Years Required</p>
                  <p className="text-[10px] text-[#76777d] uppercase tracking-wide font-semibold mt-0.5">Must-Have Skills</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedJob.requiredSkills.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] bg-[#0f172a] text-white px-2 py-0.5 rounded uppercase font-semibold">{s}</span>
                    ))}
                    {selectedJob.requiredSkills.length > 3 && (
                      <span className="text-[10px] text-[#76777d]">+{selectedJob.requiredSkills.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Search Analytics */}
          <div className="card">
            <p className="section-label mb-3">AI Search Analytics</p>
            {alignmentScore > 0 ? (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <DonutChart pct={alignmentScore} size={88} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-bold text-xl text-[#191c1e] leading-none">{alignmentScore}%</span>
                  </div>
                </div>
                <p className="text-xs text-[#45464d] text-center">Market alignment score for this role is {alignmentScore >= 75 ? 'high' : alignmentScore >= 60 ? 'moderate' : 'low'}.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-[#c6c6cd]" />
                </div>
                <p className="text-xs text-[#76777d] text-center">Run AI screening to see analytics</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card bg-red-50 border border-red-200 flex items-start gap-3 p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-red-900">Error Loading Shortlist</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
            <button onClick={() => dispatch(clearError())} className="text-xs text-red-600 hover:underline mt-1.5">Dismiss</button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-[#0f172a] mr-3" />
          <p className="text-[#45464d] font-medium text-sm">Loading screening results…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && results.length === 0 && selectedJob && !error && (
        <div className="card text-center py-14">
          <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-[#c6c6cd]" />
          </div>
          <p className="font-semibold text-[#45464d]">No screening results yet</p>
          <p className="text-sm text-[#76777d] mt-1">Run AI screening on this job to generate ranked candidates</p>
        </div>
      )}

      {/* ── Candidate Table ── */}
      {!loading && results.length > 0 && (
        <div className="card p-0 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_100px_90px_40px] gap-2 px-4 py-2.5 border-b border-[#e6e8ea] bg-[#f7f9fb]">
            <p className="section-label text-[9px]">RANK</p>
            <p className="section-label text-[9px]">CANDIDATE</p>
            <p className="section-label text-[9px] text-center">SCORE</p>
            <p className="section-label text-[9px] text-center">FIT</p>
            <p className="section-label text-[9px]">ACT.</p>
          </div>

          {/* Candidate rows */}
          {(results as PopulatedResult[]).map((result, idx) => {
            const talent = result.talent as TalentProfile;
            const { label: fitLbl, cls: fitCls } = fitLabel(result.hiringSuggestion);

            return (
              <div
                key={result._id}
                className={`grid grid-cols-[40px_1fr_100px_90px_40px] gap-2 px-4 py-3.5 cursor-pointer hover:bg-[#f7f9fb] transition-colors items-center ${idx < results.length - 1 ? 'border-b border-[#f2f4f6]' : ''}`}
                onClick={() => setSelectedCandidate(result)}
              >
                {/* Rank */}
                <p className="text-[11px] font-bold text-[#76777d]">#{result.rank}</p>

                {/* Candidate info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e293b] to-[#475569] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[10px] font-bold">
                        {talent.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#191c1e] text-sm truncate">{talent.name}</p>
                      <p className="text-[11px] text-[#76777d] truncate">
                        {talent.currentRole || talent.headline || ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-md ${scoreColor(result.matchScore)} flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{result.matchScore}</span>
                  </div>
                  <p className="text-[10px] text-[#76777d] font-medium">{result.matchScore}%</p>
                </div>

                {/* Fit label */}
                <div className="flex justify-center">
                  <span className={`${fitCls} text-center`}>{fitLbl}</span>
                </div>

                {/* Action */}
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCandidate(result); }}
                  className="p-1 rounded text-[#76777d] hover:text-[#191c1e] hover:bg-[#f2f4f6] transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
