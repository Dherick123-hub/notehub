'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Mail, Lock, Eye, EyeOff, Clock, AlertCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Read query parameters to show status banners upon redirection
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'pending') {
      setStatusNotice('Your registration was received and is pending admin approval.');
    } else if (statusParam === 'rejected') {
      setErrorMessage('Your account registration request was rejected by an administrator.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setStatusNotice(null);

    try {
      // 1. Authenticate user credentials with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setErrorMessage(authError.message);
        setIsLoading(false);
        return;
      }

      const user = authData.user;
      if (!user) {
        setErrorMessage('User session could not be established.');
        setIsLoading(false);
        return;
      }

      // 2. Fetch the user's verification status from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setErrorMessage('Failed to check account verification status.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      const status = profile?.status?.toLowerCase();

      // 3. Handle verification statuses
      if (status === 'pending') {
        // Sign out active session immediately so unapproved user cannot access the system
        await supabase.auth.signOut();
        
        // Display inline review note on login page without redirecting
        setErrorMessage('Account under review wait for Admin Approval');
        setIsLoading(false);
        return;
      }

      if (status === 'rejected') {
        await supabase.auth.signOut();
        setErrorMessage('Your account registration request was rejected by an administrator.');
        setIsLoading(false);
        return;
      }

      if (status !== 'approved') {
        await supabase.auth.signOut();
        setErrorMessage('Your account is not active. Please contact support.');
        setIsLoading(false);
        return;
      }

      // 4. Access Granted for Approved users
      router.push('/profile');
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
        Student Login
      </h2>

      {/* Info Notice Banner */}
      {statusNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3 flex items-start space-x-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Error / Account Status Banner */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3 flex items-start space-x-2 break-words">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Student Email / Username
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              placeholder="e.g. student@univ.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-sm"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end pt-1">
          <Link
            href="/forgot-password"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Log In Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition shadow-md shadow-blue-500/25 disabled:opacity-50 text-sm mt-2 flex items-center justify-center"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      {/* Register Redirect Link */}
      <p className="text-center text-xs font-medium text-slate-500 pt-2">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-bold text-blue-600 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-6">
      <div className="w-full max-w-sm flex-1 flex flex-col justify-center space-y-8 pt-12">
        {/* Logo & Tagline Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-md shadow-blue-500/20">
              <BookOpen className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              NoteHub
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 tracking-wide">
            Share notes. Ace exams.
          </p>
        </div>

        {/* Form Container wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<div className="text-center text-sm text-slate-500">Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Bottom Mobile Handle Indicator */}
      <div className="w-32 h-1 bg-slate-300 rounded-full mb-2 shrink-0" />
    </div>
  );
}