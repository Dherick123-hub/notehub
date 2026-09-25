'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Settings, 
  Zap, 
  Cpu, 
  Binary, 
  Grid,
  Compass,
  Upload,
  User
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Note {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  file_url?: string;
  upvotes_count?: number;
}

interface Profile {
  id: string;
  full_name: string;
  course: string;
  year_level: string;
  avatar_url?: string;
  status: string;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [totalUpvotes, setTotalUpvotes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError.message);
      } else if (profileData) {
        setProfile(profileData);
      }

      const { data: notesData } = await supabase
        .from('notes')
        .select('id, title, subject, created_at, file_url')
        .eq('uploader_id', user.id)
        .order('created_at', { ascending: false });

      if (notesData) {
        const { data: allUpvotes } = await supabase.from('upvotes').select('note_id');

        let sumUpvotes = 0;
        const formattedNotes = notesData.map((note) => {
          const count = allUpvotes?.filter((u) => u.note_id === note.id).length || 0;
          sumUpvotes += count;
          return {
            ...note,
            upvotes_count: count,
          };
        });

        setMyNotes(formattedNotes);
        setTotalUpvotes(sumUpvotes);
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const runFetch = async () => {
      if (!isMounted) return;
      await fetchUserData();
    };

    void runFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchUserData]);

  const getSubjectBadge = (subjectName: string) => {
    const s = subjectName.toLowerCase();
    if (s.includes('data structure')) {
      return { bg: 'bg-emerald-100/80 text-emerald-700', icon: <TreeIcon className="w-3.5 h-3.5" /> };
    }
    if (s.includes('circuit')) {
      return { bg: 'bg-amber-100/80 text-amber-700', icon: <Zap className="w-3.5 h-3.5" /> };
    }
    if (s.includes('microprocessor') || s.includes('8086')) {
      return { bg: 'bg-purple-100/80 text-purple-700', icon: <Cpu className="w-3.5 h-3.5" /> };
    }
    if (s.includes('digital') || s.includes('logic')) {
      return { bg: 'bg-teal-100/80 text-teal-700', icon: <Grid className="w-3.5 h-3.5" /> };
    }
    return { bg: 'bg-blue-100/80 text-blue-700', icon: <Binary className="w-3.5 h-3.5" /> };
  };

  const formatTimeAgo = (dateString: string) => {
    const diffInDays = Math.floor(
      (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24)
    );
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week ago`;
    return `${Math.floor(diffInDays / 30)} month ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center pb-28">
      <div className="w-full max-w-md px-5 pt-6 space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-2 rounded-2xl shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">NoteHub</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                NU BALIWAG • CpE
              </p>
            </div>
          </div>

          {/* Settings Icon Gear -> Routes to Settings Page */}
          <Link
            href="/settings"
            className="w-10 h-10 bg-white border border-slate-200/80 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>

        {/* Section Title */}
        <h2 className="text-2xl font-extrabold tracking-tight">
          Student Profile
        </h2>

        {/* Profile Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-slate-100 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base tracking-tight">
                {profile?.full_name || 'Juan Dela Cruz'}
              </h3>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                {profile?.status || 'APPROVED'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              {profile?.course || 'BS Computer Engineering'}
            </p>
            <span className="inline-block bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              Year {profile?.year_level || '3'}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500">
              Notes Shared
            </span>
            <p className="text-3xl font-extrabold text-blue-600 tracking-tight">
              {myNotes.length}
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500">
              Upvotes Received
            </span>
            <p className="text-3xl font-extrabold text-blue-600 tracking-tight">
              {totalUpvotes}
            </p>
          </div>
        </div>

        {/* My Uploads Header */}
        <div className="flex items-center justify-between pt-1">
          <h3 className="text-lg font-extrabold tracking-tight">
            My Uploads
          </h3>
          <Link
            href="/profile/uploads"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            View All
          </Link>
        </div>

        {/* Uploaded Notes List (Preview 3) */}
        <div className="space-y-3">
          {myNotes.length > 0 ? (
            myNotes.slice(0, 3).map((note) => {
              const badge = getSubjectBadge(note.subject);

              return (
                <div
                  key={note.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <h4 className="font-extrabold text-sm leading-snug">
                    {note.title}
                  </h4>

                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.bg}`}
                    >
                      {badge.icon}
                      {note.subject}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {formatTimeAgo(note.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      My Upload
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-xs font-extrabold px-3 py-1 rounded-xl">
                      {note.upvotes_count}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-400 text-xs">
              No notes uploaded yet.
            </div>
          )}
        </div>

      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-6 py-3 flex justify-around items-center max-w-md mx-auto z-40">
        <Link
          href="/browse"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
        >
          <Compass className="w-5 h-5" />
          <span>Browse</span>
        </Link>
        <Link
          href="/upload"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
        >
          <Upload className="w-5 h-5" />
          <span>Upload</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 text-blue-600 text-[10px] font-bold"
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </div>

    </div>
  );
}

function TreeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v18" />
      <path d="M12 9L7 5" />
      <path d="M12 14l5-4" />
    </svg>
  );
}