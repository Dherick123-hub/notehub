'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Settings, FileText, Upload, User as UserIcon, Loader2, Grid } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProfileData {
  id: string;
  full_name: string;
  course: string;
  year_level: string;
  status: string;
  avatar_url?: string;
}

interface NoteItem {
  id: string;
  title: string;
  subject: string;
  file_url?: string;
  created_at: string;
  upvotes_count?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [userNotes, setUserNotes] = useState<NoteItem[]>([]);
  const [showAllModal, setShowAllModal] = useState<boolean>(false);

  // States for Note Detail Modal and Upvote handling
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(false);
  const [upvoteLoading, setUpvoteLoading] = useState<boolean>(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    async function fetchUserProfile() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          router.push('/login');
          return;
        }

        const userId = session.user.id;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch notes including file_url for previewing
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('id, title, subject, file_url, created_at')
          .eq('uploader_id', userId)
          .order('created_at', { ascending: false });

        if (notesError) {
          console.error('Error fetching notes:', notesError.message);
        } else if (notesData) {
          // Fetch upvote counts for each note
          const notesWithVotes = await Promise.all(
            notesData.map(async (note) => {
              const { count } = await supabase
                .from('upvotes')
                .select('*', { count: 'exact', head: true })
                .eq('note_id', note.id);

              return {
                ...note,
                upvotes_count: count || 0,
              };
            })
          );

          setUserNotes(notesWithVotes);
        }
      } catch (error) {
        console.error('Error loading profile page:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 pt-10 px-4 flex flex-col items-center">
      {/* Hidden File Input for Avatar Selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="w-full max-w-xl">
        {/* TOP BRANDING BAR */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#2563EB] rounded-2xl flex items-center justify-center text-white shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0F172A] leading-none tracking-tight">NoteHub</h2>
              <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block mt-1">
                NU BALIWAG • CPE
              </span>
            </div>
          </div>
          <button 
            onClick={() => router.push('/settings')}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-6 tracking-tight">Student Profile</h1>

        {/* PROFILE CARD */}
        <div className="bg-white rounded-3xl p-6 mb-5 border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-4">
            
            {/* Clickable & Viewable Avatar Container */}
            <div className="relative group shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer relative border-2 border-slate-200 group-hover:border-blue-500 transition-colors shadow-inner"
                title="Click to change profile image"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                ) : profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-9 h-9 text-slate-400" />
                )}

                {/* Hover overlay with Camera icon */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity rounded-full">
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-0.5">Change</span>
                </div>
              </div>

              {/* View full-size image toggle button */}
              {profile?.avatar_url && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsViewerOpen(true);
                  }}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-white text-slate-600 hover:text-blue-600 rounded-full border border-slate-200 shadow-md transition-transform hover:scale-110"
                  title="View full avatar"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-[#0F172A] truncate">
                  {profile?.full_name || 'Student Name'}
                </h3>
                
                {profile?.status && (
                  <span 
                    className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${
                      profile.status.toLowerCase() === 'approved' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-[#2563EB] text-white'
                    }`}
                  >
                    {profile.status}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-slate-400 mt-0.5">
                {profile?.course || 'No Course Set'}
              </p>

              {profile?.year_level && (
                <span className="inline-block mt-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-0.5 rounded-full">
                  Year {profile.year_level}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-2">Notes Shared</span>
            <span className="text-3xl font-extrabold text-[#2563EB]">{userNotes.length}</span>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-2">Upvotes Received</span>
            <span className="text-3xl font-extrabold text-[#2563EB]">
              {userNotes.reduce((acc, note) => acc + (note.upvotes_count || 0), 0)}
            </span>
          </div>
        </div>

        {/* MY UPLOADS HEADER */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">My Uploads</h2>
          {userNotes.length > 0 && (
            <button 
              onClick={() => setShowAllModal(true)} 
              className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          )}
        </div>

        {/* MY UPLOADS PREVIEW LIST (Displays up to 3 items) */}
        <div className="space-y-3 mb-4">
          {userNotes.length > 0 ? (
            userNotes.slice(0, 3).map((note) => (
              <div
                key={note.id} 
                onClick={() => handleOpenNoteModal(note)}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 hover:border-blue-300 transition-colors cursor-pointer"
              >
                <h4 className="text-lg font-bold text-[#0F172A]">{note.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#0D9488] bg-[#CCFBF1] px-3 py-1 rounded-lg">
                    <Grid className="w-3.5 h-3.5" />
                    <span>{note.subject || 'General'}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    <span>My Upload</span>
                  </span>
                  <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-extrabold">
                    {note.upvotes_count || 0}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center text-slate-400 text-sm font-medium">
              No notes uploaded yet.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav Bar - Always points strictly to base routes */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-8 py-3 flex justify-center items-center z-20">
        <div className="w-full max-w-xl flex justify-around items-center">
          <Link href="/browse" className="flex flex-col items-center text-slate-400 hover:text-slate-600">
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Browse</span>
          </Link>
          <Link href="/upload" className="flex flex-col items-center text-slate-400 hover:text-slate-600">
            <Upload className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Upload</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-[#2563EB]">
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}