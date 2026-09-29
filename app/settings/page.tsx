'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sun, 
  Moon, 
  User, 
  KeyRound, 
  FileText, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  ArrowLeft,
  Shield
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Replace with authorized email or check `role` field from Supabase
const ALLOWED_ADMIN_EMAIL = 'admin@example.com';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // STEP 2: Dynamically check current logged-in user and verify admin role/permission
  useEffect(() => {
    const fetchUserDataAndPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser({
          name: user.user_metadata?.full_name || 'Jiann Carlo Liwanag',
          email: user.email || 'jianncarloliwanag@gmail.com',
        });

        // Option A: Check email match
        const isAllowedByEmail = user.email?.toLowerCase() === ALLOWED_ADMIN_EMAIL.toLowerCase();

        // Option B: Fetch role field from profiles table in Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const isAllowedByRole = profile?.role === 'admin';

        setIsAdmin(isAllowedByEmail || isAllowedByRole);
      }
    };

    fetchUserDataAndPermissions();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="p-2.5 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs transition"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight pr-7">
            Settings
          </h1>
          
          <div className="w-9" />
        </div>

        {/* Appearance Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Appearance
          </h2>
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Account & Info List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          {/* Account Info Link */}
          <Link
            href="/settings/account-info"
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition">
                  Account info
                </h3>
                <p className="text-xs text-slate-400">
                  {user?.name ? `${user.name} • ${user.email}` : 'Jiann Carlo Liwanag • jianncarloliwanag@gmail.com'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
          </Link>

          {/* Change Password Link */}
          <Link
            href="/settings/change-password"
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition">
                  Change Password
                </h3>
                <p className="text-xs text-slate-400">Update your password</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
          </Link>

          {/* Terms of Use Link */}
          <Link
            href="/settings/term-of-use"
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition">
                  Terms of Use
                </h3>
                <p className="text-xs text-slate-400">Read NoteHub terms</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
          </Link>

          {/* Academic Integrity Policy */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Academic Integrity Policy
                </h3>
                <p className="text-xs text-slate-400">Review sharing rules</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>

          {/* STEP 2 UI: Admin Portal Link rendered conditionally */}
          {isAdmin && (
            <Link
              href="/admin"
              className="p-4 flex items-center justify-between hover:bg-emerald-50/60 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#1E7245] transition">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1E7245]">
                    Admin Portal
                  </h3>
                  <p className="text-xs text-slate-400">Manage user queue and moderation</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#1E7245] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* Log Out Button */}
          <button
            onClick={handleLogout}
            className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-600">Log Out</h3>
                <p className="text-xs text-red-400">Sign out of NoteHub</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300 group-hover:text-red-500 transition" />
          </button>
        </div>

      </div>
    </div>
  );
}