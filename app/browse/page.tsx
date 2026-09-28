'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  Search, 
  FileText, 
  Upload, 
  User as UserIcon,
  BookOpen,
  Zap,
  Cpu,
  Layers,
  ArrowUp,
  X,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Note {
  id: string;
  title: string;
  subject: string;
  file_url: string;
  created_at: string;
  uploader_id: string;
  profiles?:
    | {
        full_name: string | null;
        course: string | null;
        year_level: string | null;
      }
    | Array<{
        full_name: string | null;
        course: string | null;
        year_level: string | null;
      }>
    | null;
  upvotes_count?: number;
  user_has_upvoted?: boolean;
}

const SUBJECT_CATEGORIES = [
  { id: 'all', label: 'All', icon: null },
  { id: 'Data Structures', label: 'Data Structures', icon: Layers },
  { id: 'Circuits 2', label: 'Circuits 2', icon: Zap },
  { id: 'Microprocessors', label: 'Microprocessors', icon: Cpu },
  { id: 'Digital Logic', label: 'Digital Logic', icon: BookOpen },
];

export default function BrowsePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  // Fetch Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  // Fetch Notes Function
  const fetchNotes = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('notes')
      .select(`
        id,
        title,
        subject,
        file_url,
        created_at,
        uploader_id,
        profiles (
          full_name,
          course,
          year_level
        )
      `)
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('subject', selectedCategory);
    }

    const { data: notesData, error } = await query;

    if (error) {
      console.error('Error fetching notes:', error.message);
      setLoading(false);
      return;
    }

    if (notesData) {
      const updatedNotes = await Promise.all(
        notesData.map(async (note) => {
          const { count } = await supabase
            .from('upvotes')
            .select('*', { count: 'exact', head: true })
            .eq('note_id', note.id);

          let hasUpvoted = false;
          if (currentUserId) {
            const { data: userUpvote } = await supabase
              .from('upvotes')
              .select('id')
              .eq('note_id', note.id)
              .eq('user_id', currentUserId)
              .maybeSingle();

            hasUpvoted = !!userUpvote;
          }

          return {
            ...note,
            upvotes_count: count || 0,
            user_has_upvoted: hasUpvoted,
          };
        })
      );

      setNotes(updatedNotes as Note[]);
    }
    setLoading(false);
  }, [selectedCategory, currentUserId]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  // Handle Upvote
  const handleUpvote = async (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!currentUserId) {
      alert('Please log in to upvote notes.');
      return;
    }

    const targetNote = notes.find((n) => n.id === noteId);
    if (!targetNote) return;

    const isCurrentlyUpvoted = targetNote.user_has_upvoted;

    // Optimistic UI update
    setNotes((prevNotes) =>
      prevNotes.map((n) => {
        if (n.id === noteId) {
          const newHasUpvoted = !n.user_has_upvoted;
          const countDiff = newHasUpvoted ? 1 : -1;
          return {
            ...n,
            user_has_upvoted: newHasUpvoted,
            upvotes_count: Math.max(0, (n.upvotes_count || 0) + countDiff),
          };
        }
        return n;
      })
    );

    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote((prev) =>
        prev
          ? {
              ...prev,
              user_has_upvoted: !prev.user_has_upvoted,
              upvotes_count: Math.max(
                0,
                (prev.upvotes_count || 0) + (prev.user_has_upvoted ? -1 : 1)
              ),
            }
          : null
      );
    }

    // Database operation
    if (isCurrentlyUpvoted) {
      await supabase
        .from('upvotes')
        .delete()
        .eq('note_id', noteId)
        .eq('user_id', currentUserId);
    } else {
      await supabase
        .from('upvotes')
        .insert([{ note_id: noteId, user_id: currentUserId }]);
    }
  };

  const handleDownload = (fileUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = title || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim() || !selectedNote) return;
    if (!currentUserId) {
      alert('Please log in to report a note.');
      return;
    }

    setIsSubmittingReport(true);

    const { error } = await supabase.from('reports').insert([
      {
        note_id: selectedNote.id,
        reporter_id: currentUserId,
        reason: reportReason.trim(),
        status: 'pending',
      },
    ]);

    setIsSubmittingReport(false);

    if (!error) {
      alert('Report submitted successfully.');
      setReportReason('');
      setShowReport(false);
    } else {
      console.error('Report submission error:', error.message);
      alert('Failed to submit report. Please try again.');
    }
  };

  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase().trim();
    const profile = Array.isArray(note.profiles) ? note.profiles[0] : note.profiles;
    const uploaderName = profile?.full_name?.toLowerCase() || '';
    return (
      note.title.toLowerCase().includes(query) ||
      note.subject.toLowerCase().includes(query) ||
      uploaderName.includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pb-28">
      {/* MAIN CONTAINER */}
      <main className="w-full max-w-md px-4 pt-8 space-y-6">
        {/* BRANDING HEADER */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#2563EB] rounded-2xl flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight leading-none">
              NoteHub
            </h1>
            <span className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider block mt-1">
              NU BALIWAG • CPE
            </span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes, subjects, or uploaders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-800 text-sm pl-11 pr-4 py-3 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm placeholder:text-slate-400"
          />
        </div>

        {/* CATEGORY SELECTOR WITH VISIBLE SCROLLBAR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {SUBJECT_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* SECTION HEADING */}
        <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
          Latest Shares
        </h2>

        {/* CARD LIST */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-5 border border-slate-100 animate-pulse h-32"
              />
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="space-y-4">
            {filteredNotes.map((note) => {
              const profile = Array.isArray(note.profiles) ? note.profiles[0] : note.profiles;
              const uploaderName = profile?.full_name || 'juan';
              const courseYear = profile?.course
                ? `${profile.course} ${profile.year_level || ''}`
                : 'CpE 3';

              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4"
                >
                  <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                    {note.title}
                  </h3>

                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-xl">
                      <BookOpen className="w-3.5 h-3.5 text-[#059669]" />
                      {note.subject || 'Digital Logic'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                      {uploaderName} • {courseYear}
                    </span>

                    <button
                      onClick={(e) => handleUpvote(note.id, e)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition ${
                        note.user_has_upvoted
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>{note.upvotes_count || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-slate-400 text-sm font-medium">
            No notes found matching your criteria.
          </div>
        )}
      </main>

      {/* DETAIL MODAL */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedNote(null);
                setShowReport(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {selectedNote.subject}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
                {selectedNote.title}
              </h2>
              {(() => {
                const profile = Array.isArray(selectedNote.profiles)
                  ? selectedNote.profiles[0]
                  : selectedNote.profiles;
                return (
                  <p className="text-xs font-medium text-slate-400">
                    By {profile?.full_name || 'juan'}{' '}
                    {profile?.course && `• ${profile.course}`}
                  </p>
                );
              })()}
            </div>

            <div className="w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80 max-h-80 flex items-center justify-center">
              {selectedNote.file_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <img
                  src={selectedNote.file_url}
                  alt={selectedNote.title}
                  className="w-full h-full object-contain max-h-80"
                />
              ) : (
                <div className="p-10 text-center space-y-2">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    Document Preview Available via Download
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleUpvote(selectedNote.id)}
                className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                  selectedNote.user_has_upvoted
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
                Upvote • {selectedNote.upvotes_count || 0}
              </button>

              <button
                onClick={() =>
                  handleDownload(
                    selectedNote.file_url,
                    selectedNote.title
                  )
                }
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowReport(!showReport)}
                className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                <span className="flex items-center gap-2 text-slate-600">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  Report Issue
                </span>
                {showReport ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showReport && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Describe the issue with this file..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-white text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    disabled={isSubmittingReport || !reportReason.trim()}
                    onClick={handleReportSubmit}
                    className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition"
                  >
                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-8 py-3 flex justify-center items-center z-20">
        <div className="w-full max-w-md flex justify-around items-center">
          <Link
            href="/browse"
            className="flex flex-col items-center text-[#2563EB]"
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Browse</span>
          </Link>
          <Link
            href="/upload"
            className="flex flex-col items-center text-slate-400 hover:text-slate-600"
          >
            <Upload className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Upload</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center text-slate-400 hover:text-slate-600"
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}