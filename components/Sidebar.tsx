'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard, Briefcase, Users, Cpu, Trophy,
  LogOut, ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/jobs',       icon: Briefcase,        label: 'Jobs'         },
  { href: '/applicants', icon: Users,             label: 'Candidates'  },
  { href: '/screening',  icon: Cpu,               label: 'AI Screening' },
  { href: '/shortlist',  icon: Trophy,            label: 'Shortlist'   },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="w-60 h-full bg-[#0f172a] flex flex-col flex-shrink-0 hidden lg:flex overflow-y-auto">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight">
              UmuravaHire<span className="text-blue-400">AI</span>
            </p>
            <p className="text-white/35 text-[9px] font-medium tracking-widest leading-tight mt-0.5">
              RECRUITMENT INTELLIGENCE
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-white/25 text-[9px] font-semibold tracking-widest uppercase px-3 mb-3">Main Menu</p>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer group ${
                active
                  ? 'bg-white/12 text-white'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/6'
              }`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-white/45 group-hover:text-white/70'}`} />
                <span className="text-[13px] font-medium flex-1">{label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t border-white/8 pt-3">
        {session?.user ? (
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-2 py-2 rounded-md">
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name ?? ''} className="w-7 h-7 rounded-full flex-shrink-0 object-cover border border-white/20" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white truncate">{session.user.name}</p>
                <p className="text-[10px] text-white/35 truncate">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-white/40 hover:text-white/70 hover:bg-white/6 transition-all text-[13px] font-medium"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              Sign out
            </button>
          </div>
        ) : (
          <Link href="/login">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-white/40 hover:text-white/70 hover:bg-white/6 transition-all cursor-pointer">
              <ChevronRight className="w-4 h-4" />
              <span className="text-[13px] font-medium">Sign in</span>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
