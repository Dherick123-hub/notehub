'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { 
  Settings, 
  FileText, 
  Upload, 
  User as UserIcon, 
  Loader2, 
  Grid, 
  Camera, 
  Maximize2, 
  X 
} from 'lucide-react';

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

        // Query using uploader_id to match Upload page inserts
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('id, title, subject, created_at')
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

  // Handle uploading avatar image to Supabase Storage
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!e.target.files || e.target.files.length === 0 || !profile?.id) {
        return;
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

      // 1. Upload file to Supabase 'avatars' storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Obtain Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update profiles table in Supabase database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Update state dynamically
      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : null);
    } catch (err: any) {
      alert(err.message || 'Error uploading profile image.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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

        {/* Dynamic Stats Calculation */}
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

        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">My Uploads</h2>
          <Link href="/browse" className="text-xs font-bold text-[#2563EB] hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-3 mb-4">
          {userNotes.length > 0 ? (
            userNotes.map((note) => (
              <Link 
                key={note.id} 
                href={`/browse/${note.id}`}
                className="block bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 hover:border-blue-300 transition-colors cursor-pointer"
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
              </Link>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center text-slate-400 text-sm font-medium">
              No notes uploaded yet.
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Fullscreen Modal Viewer */}
      {isViewerOpen && profile?.avatar_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-sm w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center p-6">
            <button
              onClick={() => setIsViewerOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-sm font-bold text-slate-300 mb-4">{profile.full_name}</h4>

            <div className="w-64 h-64 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-lg mb-6">
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={() => {
                setIsViewerOpen(false);
                fileInputRef.current?.click();
              }}
              className="py-2.5 px-6 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Upload New Picture
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
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