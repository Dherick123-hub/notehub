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
  X, 
  ArrowUp, 
  Download, 
  AlertTriangle, 
  ChevronDown,
  Camera
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
  file_url?: string;
  created_at: string;
  upvotes_count?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Handle avatar upload to Supabase Storage
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload image to 'avatars' storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Retrieve public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update public URL in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar.');
    } finally {
      setLoading(false);
    }
  };

  // Open note details and check if user upvoted
  const handleOpenNoteModal = async (note: NoteItem) => {
    setSelectedNote(note);
    setHasUpvoted(false);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: userVote } = await supabase
        .from('upvotes')
        .select('id')
        .eq('note_id', note.id)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (userVote) setHasUpvoted(true);
    }
  };

  // Toggle upvote within the modal
  const handleToggleUpvote = async () => {
    if (!selectedNote || upvoteLoading) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return alert('Please log in to upvote');

    setUpvoteLoading(true);
    const userId = session.user.id;
    const currentVotes = selectedNote.upvotes_count || 0;

    if (hasUpvoted) {
      await supabase
        .from('upvotes')
        .delete()
        .eq('note_id', selectedNote.id)
        .eq('user_id', userId);

      const updatedCount = Math.max(0, currentVotes - 1);
      setHasUpvoted(false);
      
      // Update selected note state
      setSelectedNote({ ...selectedNote, upvotes_count: updatedCount });
      
      // Update main notes array state
      setUserNotes((prev) =>
        prev.map((n) => (n.id === selectedNote.id ? { ...n, upvotes_count: updatedCount } : n))
      );
    } else {
      await supabase.from('upvotes').insert({
        note_id: selectedNote.id,
        user_id: userId,
      });

      const updatedCount = currentVotes + 1;
      setHasUpvoted(true);

      // Update selected note state
      setSelectedNote({ ...selectedNote, upvotes_count: updatedCount });

      // Update main notes array state
      setUserNotes((prev) =>
        prev.map((n) => (n.id === selectedNote.id ? { ...n, upvotes_count: updatedCount } : n))
      );
    }

    setUpvoteLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 pt-10 px-4 flex flex-col items-center">
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
            {/* AVATAR WITH CLICKABLE OVERLAY */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer group"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-9 h-9 text-slate-400" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* HIDDEN FILE INPUT */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />

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

      {/* VIEW ALL UPLOADS MODAL */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xl font-extrabold text-[#0F172A]">All My Uploads</h2>
              <button
                onClick={() => setShowAllModal(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {userNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleOpenNoteModal(note)}
                  className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-200 hover:border-blue-400 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-[#0F172A] leading-snug">
                      {note.title}
                    </h3>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                      <ArrowUp className="w-3 h-3 text-[#2563EB]" />
                      {note.upvotes_count || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="text-[#0D9488] bg-[#CCFBF1] px-2.5 py-0.5 rounded-md font-bold">
                      {note.subject || 'General'}
                    </span>
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NOTE PREVIEW / DETAIL MODAL */}
      {selectedNote && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl relative space-y-5">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedNote(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* HEADER */}
            <div>
              <span className="text-xs font-black text-[#2563EB] uppercase tracking-wider">
                {selectedNote.subject || 'GENERAL'}
              </span>
              <h1 className="text-2xl font-black text-[#0F172A] mt-0.5">{selectedNote.title}</h1>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                By {profile?.full_name || 'Student'} • {profile?.course || 'BS Computer Engineering'}
              </p>
            </div>

            {/* FILE PREVIEW */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center min-h-[260px] max-h-[380px]">
              {selectedNote.file_url ? (
                <img src={selectedNote.file_url} alt={selectedNote.title} className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs font-semibold text-slate-400">Preview not available</span>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleToggleUpvote}
                disabled={upvoteLoading}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition ${
                  hasUpvoted ? 'bg-blue-800 text-white' : 'bg-[#2563EB] hover:bg-blue-600 text-white'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
                Upvote • {selectedNote.upvotes_count || 0}
              </button>

              <a
                href={selectedNote.file_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-600 text-white py-3 rounded-2xl font-black text-sm transition ${
                  !selectedNote.file_url ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>

            {/* REPORT SECTION */}
            <div className="border border-slate-100 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50/50 cursor-pointer">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                <span>Report Issue</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV BAR */}
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