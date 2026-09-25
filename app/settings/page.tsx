'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ChevronRight, Sun, Moon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    }

    loadUserData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/profile"
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            NH
          </div>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Settings
        </h2>

        {/* Appearance Setting */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Appearance</h3>
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                theme === 'light'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
          </div>
        </div>

        {/* Account & Policies Menu Group */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {/* Account Info */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-900">Account info</p>
              <p className="text-xs text-slate-500">
                {profile?.full_name || 'Student'} • {user?.email || 'student@univ.edu'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Change Password */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-900">Change Password</p>
              <p className="text-xs text-slate-500">Update your password</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Terms of Use */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-900">Terms of Use</p>
              <p className="text-xs text-slate-500">Read NoteHub terms</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Academic Integrity Policy */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-900">Academic Integrity Policy</p>
              <p className="text-xs text-slate-500">Review sharing rules</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Log Out Button */}
          <button
            onClick={handleLogout}
            className="w-full p-4 flex items-center justify-between hover:bg-red-50 text-left transition-colors group"
          >
            <div>
              <p className="text-sm font-bold text-red-600">Log Out</p>
              <p className="text-xs text-slate-500">Sign out of NoteHub</p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}