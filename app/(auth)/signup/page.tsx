'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const rules = [
  { test: (p: string) => p.length >= 6,  label: 'At least 6 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
];

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('callbackUrl') || '/dashboard';
  const callbackUrl = raw.startsWith('http') ? new URL(raw).pathname : raw;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passOk = rules.every((r) => r.test(password));
  const confirmOk = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passOk) { setError('Password does not meet requirements'); return; }
    if (!confirmOk) { setError('Passwords do not match'); return; }
    setLoading(true); setError(null);

    const reg = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await reg.json();
    if (!reg.ok) { setLoading(false); setError(data.message); return; }

    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    else router.push(callbackUrl);
  };

  const handleGoogle = () => { setGLoading(true); signIn('google', { callbackUrl }); };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#191c1e] mb-1.5">Create your account</h1>
        <p className="text-[#45464d] text-sm">Start screening talent with AI in minutes</p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {googleEnabled && (
        <>
          <button onClick={handleGoogle} disabled={gLoading}
            className="w-full flex items-center justify-center gap-3 border border-[#c6c6cd] rounded-md py-3 px-4 text-sm font-medium text-[#191c1e] bg-white hover:bg-[#f2f4f6] transition-colors mb-4 disabled:opacity-60">
            {gLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#76777d]" /> : <GoogleIcon />}
            Sign up with Google
          </button>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#e6e8ea]" />
            <span className="text-xs text-[#76777d] font-medium">or with email</span>
            <div className="flex-1 h-px bg-[#e6e8ea]" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your full name" className="input pl-10" />
          </div>
        </div>

        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com" className="input pl-10" />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
            <input type={showPass ? 'text' : 'password'} required value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Create a password"
              className="input pl-10 pr-11" />
            <button type="button" tabIndex={-1} onClick={() => setShowPass((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#45464d]">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              {rules.map(({ test, label }) => (
                <p key={label} className={`flex items-center gap-1.5 text-xs ${test(password) ? 'text-emerald-600' : 'text-[#76777d]'}`}>
                  <CheckCircle2 className={`w-3 h-3 ${test(password) ? 'text-emerald-500' : 'text-[#c6c6cd]'}`} />
                  {label}
                </p>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
            <input type={showPass ? 'text' : 'password'} required value={confirm}
              onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password"
              className={`input pl-10 ${confirm.length > 0 ? (confirmOk ? 'border-emerald-400' : 'border-red-400') : ''}`} />
          </div>
        </div>

        <button type="submit" disabled={loading || !name || !email || !passOk || !confirmOk}
          className="w-full btn-primary justify-center py-3 rounded-md">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-[#45464d] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[400px] flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-[#0f172a]" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
