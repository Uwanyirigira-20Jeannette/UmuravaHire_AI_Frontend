import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-row overflow-hidden">

      {/* ── Blue panel — always left, shrinks on mobile ── */}
      <div className="w-[42%] sm:w-2/5 lg:w-1/2 xl:w-[52%] h-full bg-[#0f172a] flex flex-col relative overflow-hidden flex-shrink-0">

        {/* Background accent blobs */}
        <div className="absolute top-[-120px] left-[-120px] w-[480px] h-[480px] rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-80px] w-[360px] h-[360px] rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-900/30 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-4 sm:px-7 lg:px-12 py-6 lg:py-10">

          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 lg:gap-3 self-start">
            <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-[11px] sm:text-[13px] lg:text-[18px] tracking-tight leading-none">
                UmuravaHire<span className="text-blue-400">AI</span>
              </span>
              <span className="hidden sm:block text-[7px] lg:text-[10px] font-bold tracking-widest text-blue-400/80 uppercase mt-0.5 lg:mt-1">
                Recruitment Intelligence
              </span>
            </div>
          </Link>

          {/* Main copy */}
          <div className="mt-auto mb-auto pt-6 lg:pt-16">
            <h2 className="text-[1rem] sm:text-[1.3rem] lg:text-[2.4rem] font-black text-white leading-[1.2] mb-2 lg:mb-5">
              Hire smarter,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                not harder.
              </span>
            </h2>
            <p className="hidden sm:block text-slate-400 text-[10px] sm:text-[11px] lg:text-[15px] leading-relaxed">
              Let Gemini AI do the heavy lifting — score, rank, and shortlist candidates in seconds so your team focuses on the best talent.
            </p>
          </div>

          {/* Bottom tagline — hidden on small screens */}
          <p className="hidden lg:block text-slate-600 text-xs mt-auto">
            Built for the Umurava AI Talent Community
          </p>

        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 h-full bg-white overflow-y-auto flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {children}
      </div>

    </div>
  );
}
