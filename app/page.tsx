'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://umuravahire-ai-backend-1.onrender.com';

export default function HomePage() {
  const [status, setStatus]     = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [jobCount, setJobCount] = useState<number | null>(null);

  const testConnection = async () => {
    setStatus('loading');
    try {
      const res  = await fetch(`${apiUrl}/api/jobs`);
      if (res.ok) {
        const data  = await res.json();
        const count = Array.isArray(data) ? data.length : (data.jobs?.length ?? 0);
        setJobCount(count);
        setStatus('ok');
        console.log(`Backend connected — ${count} jobs found`, data);
        alert(`Connected! ${count} job${count !== 1 ? 's' : ''} found on backend.`);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6">
        {/* Brand */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-[#0f172a]">
            UmuravaHire<span className="text-blue-500">AI</span>
          </h1>
          <p className="text-[#45464d] text-sm mt-1">AI-Powered Recruitment Intelligence</p>
        </div>

        {/* Backend URL */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-[#76777d] uppercase tracking-wide mb-1.5">Backend API</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm text-[#191c1e] bg-[#f2f4f6] rounded-md px-3 py-2 font-mono truncate">
              {apiUrl}
            </code>
            <a
              href={`${apiUrl}/api/jobs`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md text-[#76777d] hover:text-[#191c1e] hover:bg-[#f2f4f6] transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Test connection */}
        <div className="card p-4 space-y-3">
          <p className="text-xs font-semibold text-[#76777d] uppercase tracking-wide">Connection Test</p>
          <button
            onClick={testConnection}
            disabled={status === 'loading'}
            className="w-full btn-primary justify-center py-3"
          >
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Testing connection…</>
            ) : (
              'Test Backend Connection'
            )}
          </button>

          {status === 'ok' && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-md px-3 py-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">
                Connected — {jobCount} job{jobCount !== 1 ? 's' : ''} found
              </span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-md px-3 py-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Connection failed — backend may be starting up</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Link href="/login" className="flex-1">
            <button className="w-full btn-secondary justify-center py-3">Sign In</button>
          </Link>
          <Link href="/signup" className="flex-1">
            <button className="w-full btn-primary justify-center py-3">Get Started</button>
          </Link>
        </div>

        <p className="text-center text-xs text-[#76777d]">Built for the Umurava AI Talent Community · Powered by Gemini</p>
      </div>
    </div>
  );
}
