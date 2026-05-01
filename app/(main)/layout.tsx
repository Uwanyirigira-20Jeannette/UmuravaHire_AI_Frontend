'use client';

import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Briefcase, Users, Cpu, Trophy, LogOut } from 'lucide-react';
import { getAuthUser, clearAuthUser, type AuthUser } from '@/lib/auth-client';

const mobileNav = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Home'   },
  { href: '/jobs',       icon: Briefcase,        label: 'Jobs'   },
  { href: '/applicants', icon: Users,             label: 'Candidates' },
  { href: '/screening',  icon: Cpu,               label: 'Screen' },
  { href: '/shortlist',  icon: Trophy,            label: 'List'   },
];

function MobileBottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e6e8ea]">
      <div className="flex">
        {mobileNav.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className="flex-1">
              <div className={`flex flex-col items-center gap-0.5 py-2 px-1 transition-colors ${active ? 'text-[#0f172a]' : 'text-[#76777d]'}`}>
                <Icon className={`w-5 h-5 ${active ? 'text-[#0f172a]' : 'text-[#76777d]'}`} />
                <span className={`text-[8px] font-medium ${active ? 'text-[#0f172a]' : 'text-[#76777d]'}`}>{label}</span>
                {active && <div className="w-4 h-0.5 rounded-full bg-[#0f172a] mt-0.5" />}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MobileUserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setUser(getAuthUser()); }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleSignOut = () => {
    clearAuthUser();
    router.push('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center focus:outline-none"
        aria-label="Account menu"
      >
        <span className="text-white text-xs font-bold">{initials}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-white border border-[#e6e8ea] rounded-xl shadow-xl p-1.5 w-52 z-50">
          {user && (
            <div className="px-3 py-2.5 mb-1 border-b border-[#f2f4f6]">
              <p className="text-[13px] font-semibold text-[#191c1e] truncate">{user.name}</p>
              <p className="text-[11px] text-[#76777d] truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-[13px] font-semibold"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#e6e8ea] sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#0f172a] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span className="font-bold text-[#0f172a] text-[15px]">
              UmuravaHire<span className="text-blue-600">AI</span>
            </span>
          </div>
          <MobileUserMenu />
        </header>

        <main className="flex-1 p-4 lg:p-7 overflow-y-auto pb-20 lg:pb-7">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
