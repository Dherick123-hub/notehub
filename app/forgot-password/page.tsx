'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { BookOpen, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    } else {
      setIsSent(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">NoteHub</h1>
          <p className="text-xs text-slate-400 font-medium">Reset your password</p>
        </div>

        {isSent ? (
          /* Success State */
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-emerald-900">Check your email</h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              We sent a password reset link to <span className="font-semibold">{email}</span>. Please check your inbox or spam folder.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleResetPassword} className="space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">
                Student Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="e.g. student@univ.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-3 border border-slate-200/80 rounded-2xl text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl transition text-sm shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* Navigation Footer */}
        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}