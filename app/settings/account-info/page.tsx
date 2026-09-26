'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  BookOpen, 
  GraduationCap, 
  Save, 
  Loader2, 
  Check, 
  AlertCircle 
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AccountInfoPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [course, setCourse] = useState('');
  const [yearLevel, setYearLevel] = useState('');

  useEffect(() => {
    async function loadUserData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

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
        setFullName(profileData.full_name || currentUser.user_metadata?.full_name || '');
        setCourse(profileData.course || '');
        setYearLevel(profileData.year_level || '');
      } else {
        setFullName(currentUser.user_metadata?.full_name || '');
      }

      setLoading(false);
    }

    loadUserData();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          course: course,
          year_level: yearLevel,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setStatusMessage({ type: 'success', text: 'Account information updated successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update account information.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className="p-2.5 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs transition"
            title="Back to Settings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight pr-7">
            Account Info
          </h1>
          
          <div className="w-9" />
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Account Details Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            
            {/* Email Field (Disabled) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 pl-1">
                Email address is managed by your authentication provider.
              </p>
            </div>

            {/* Full Name Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="e.g. Jiann Carlo Liwanag"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:outline-hidden text-xs font-medium text-slate-900 transition"
                />
              </div>
            </div>

            {/* Course Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Course / Program
              </label>
              <div className="relative flex items-center">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. BS Computer Engineering"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:outline-hidden text-xs font-medium text-slate-900 transition"
                />
              </div>
            </div>

            {/* Year Level Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Year Level
              </label>
              <div className="relative flex items-center">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  placeholder="e.g. 3rd Year"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:outline-hidden text-xs font-medium text-slate-900 transition"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <Link
                href="/settings"
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}