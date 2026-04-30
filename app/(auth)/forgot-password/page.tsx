'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send reset link. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-[#76777d] hover:text-[#191c1e] font-medium mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>

      {sent ? (
        /* ── Success state ── */
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#191c1e] mb-2">Check your inbox</h1>
          <p className="text-sm text-[#45464d] leading-relaxed mb-6">
            If <span className="font-semibold text-[#191c1e]">{email}</span> is registered,
            we've sent a password reset link. It may take a minute to arrive.
          </p>
          <p className="text-xs text-[#76777d]">
            Didn't receive it?{' '}
            <button
              onClick={() => setSent(false)}
              className="text-blue-600 font-semibold hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
      ) : (
        /* ── Form state ── */
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#191c1e] mb-1.5">Reset your password</h1>
            <p className="text-sm text-[#45464d]">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full btn-primary justify-center py-3 rounded-md"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-sm text-[#45464d] mt-6">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
