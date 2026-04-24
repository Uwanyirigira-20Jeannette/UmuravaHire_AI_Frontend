import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Left dark panel ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] h-full bg-[#0f172a] flex-col relative overflow-hidden">

        {/* Background accent blobs */}
        <div className="absolute top-[-120px] left-[-120px] w-[480px] h-[480px] rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-80px] w-[360px] h-[360px] rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-900/30 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">

          {/* Logo */}
          <Link href="/" className="inline-flex items-start gap-3 self-start">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-[18px] tracking-tight leading-none">
                UmuravaHire<span className="text-blue-400">AI</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-blue-400/80 uppercase mt-1">
                Recruitment Intelligence
              </span>
            </div>
          </Link>

          {/* Main copy */}
          <div className="mt-auto mb-auto pt-16">
            <h2 className="text-[2.4rem] font-black text-white leading-[1.15] mb-5">
              Hire smarter,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                not harder.
              </span>
            </h2>
            <p className="text-slate-400 text-[15px] leading-relaxed max-w-sm">
              Let Gemini AI do the heavy lifting — score, rank, and shortlist candidates in seconds so your team focuses on the best talent.
            </p>
          </div>

          {/* Bottom tagline */}
          <p className="text-slate-600 text-xs mt-auto">
            Built for the Umurava AI Talent Community
          </p>

        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 h-full bg-white overflow-y-auto flex items-center justify-center p-8">
        {children}
      </div>

    </div>
  );
}
