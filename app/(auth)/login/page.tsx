'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, Info } from 'lucide-react';
import { setAuthUser } from '@/lib/auth-client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('callbackUrl') || '/dashboard';
  const callbackUrl  = raw.startsWith('http') ? new URL(raw).pathname : raw;
  const wasRedirected = !!params.get('callbackUrl');

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);

    if (password.length < 6) {
      setError('Incorrect email or password. Please try again.');
      setLoading(false);
      return;
    }

    const name = email.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').trim() || 'User';
    setAuthUser({ name, email });
    router.push(callbackUrl);
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#191c1e] mb-1.5">Sign in to your account</h1>
        <p className="text-[#45464d] text-sm">Welcome back to UmuravaHire AI</p>
      </div>

      {wasRedirected && (
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-md px-4 py-3 mb-5">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 font-medium">You need to sign in to access that page.</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleCredentials} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input pl-10 pr-11"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#45464d] transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end mt-1.5">
            <Link href="/forgot-password" className="text-xs text-blue-600 font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full btn-primary justify-center py-3 rounded-md"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-[#45464d] mt-6">
        Don't have an account?{' '}
        <Link
          href={`/signup${wasRedirected ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
          className="text-blue-600 font-semibold hover:underline"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[400px] flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-[#0f172a]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
