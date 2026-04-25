'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { setAuthUser } from '@/lib/auth-client';

const rules = [
  { test: (p: string) => p.length >= 6,   label: 'At least 6 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter'  },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number'            },
];

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('callbackUrl') || '/dashboard';
  const callbackUrl = raw.startsWith('http') ? new URL(raw).pathname : raw;

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const passOk    = rules.every((r) => r.test(password));
  const confirmOk = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passOk)    { setError('Password does not meet requirements'); return; }
    if (!confirmOk) { setError('Passwords do not match'); return; }
    setLoading(true); setError(null);

    setAuthUser({ name, email });
    router.push(callbackUrl);
  };

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
