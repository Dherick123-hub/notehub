'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  BookOpen, 
  Search, 
  ArrowUp, 
  User, 
  FileText, 
  Upload, 
  Cpu, 
  Zap, 
  Binary, 
  Grid 
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
  profiles: { 
    full_name: string;
    course?: string;
    year_level?: string;
  };
  upvotes_count?: number;
  user_has_upvoted?: boolean;
}

export default function Feed() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotesAndUpvotes();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchNotesAndUpvotes();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotesAndUpvotes = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setCurrentUserId(user.id);

      const { data: notesData } = await supabase
        .from('notes')
        .select('*, profiles(full_name, course, year_level)')
        .order('created_at', { ascending: false });

      const { data: upvotesData } = await supabase
        .from('upvotes')
        .select('note_id, user_id');

      if (notesData) {
        const processedNotes = notesData.map((note) => {
          const noteUpvotes = upvotesData?.filter((u) => u.note_id === note.id) || [];
          const userHasUpvoted = noteUpvotes.some((u) => u.user_id === user.id);

          return {
            ...note,
            upvotes_count: noteUpvotes.length,
            user_has_upvoted: userHasUpvoted,
          };
        });

        setNotes(processedNotes as unknown as Note[]);
      }
    } else {
      setCurrentUserId(null);
      setNotes([]);
    }
    setIsLoading(false);
  };

  const handleToggleUpvote = async (noteId: string, currentlyUpvoted: boolean) => {
    if (!currentUserId) return;

    // Optimistic UI update
    setNotes((prevNotes) =>
      prevNotes.map((n) => {
        if (n.id === noteId) {
          return {
            ...n,
            user_has_upvoted: !currentlyUpvoted,
            upvotes_count: currentlyUpvoted
              ? (n.upvotes_count || 1) - 1
              : (n.upvotes_count || 0) + 1,
          };
        }
        return n;
      })
    );

    if (currentlyUpvoted) {
      await supabase
        .from('upvotes')
        .delete()
        .eq('note_id', noteId)
        .eq('user_id', currentUserId);
    } else {
      await supabase.from('upvotes').insert({
        note_id: noteId,
        user_id: currentUserId,
      });
    }
  };

  // Tag Color & Icon Helper
  const getSubjectBadge = (subjectName: string) => {
    const s = subjectName.toLowerCase();

    if (s.includes('data structure')) {
      return {
        bg: 'bg-emerald-100/70 text-emerald-700',
        icon: <TreeIcon className="w-3.5 h-3.5" />,
      };
    }
    if (s.includes('circuit')) {
      return {
        bg: 'bg-amber-100/70 text-amber-700',
        icon: <Zap className="w-3.5 h-3.5" />,
      };
    }
    if (s.includes('microprocessor') || s.includes('8086')) {
      return {
        bg: 'bg-purple-100/70 text-purple-700',
        icon: <Cpu className="w-3.5 h-3.5" />,
      };
    }
    if (s.includes('digital') || s.includes('logic')) {
      return {
        bg: 'bg-teal-100/70 text-teal-700',
        icon: <Grid className="w-3.5 h-3.5" />,
      };
    }

    return {
      bg: 'bg-blue-100/70 text-blue-700',
      icon: <Binary className="w-3.5 h-3.5" />,
    };
  };

  const subjectFilters = ['All', 'Data Structures', 'Circuits 2', 'Microprocessors', 'Digital Logic'];

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === 'All' ||
      note.subject.toLowerCase().includes(selectedSubject.toLowerCase());
    return matchesSearch && matchesSubject;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
        Loading NoteHub Feed...
      </div>
    );
  }

  // Guest view if not signed in
  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Welcome to NoteHub</h2>
          <p className="text-xs text-slate-500">
            Log in or register to browse course notes, reviewers, and cheat sheets shared by students.
          </p>
          <div className="flex gap-2 pt-2">
            <Link
              href="/login"
              className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-blue-700 transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="flex-1 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-20">
      <div className="w-full max-w-md px-4 pt-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
              NoteHub
            </h1>
            <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
              NU BALIWAG • CpE
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes or subject"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 border border-slate-200/80 rounded-2xl text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* Horizontal Subject Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {subjectFilters.map((sub) => {
            const badge = getSubjectBadge(sub);
            const isSelected = selectedSubject === sub;

            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                {!isSelected && sub !== 'All' && badge.icon}
                {sub}
              </button>
            );
          })}
        </div>

        {/* Section Title */}
        <h2 className="text-lg font-bold text-slate-900 pt-1">Latest Shares</h2>

        {/* Note Cards List */}
        <div className="space-y-3">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const badge = getSubjectBadge(note.subject);

              return (
                <div
                  key={note.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3 hover:border-slate-200 transition"
                >
                  <a
                    href={note.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition">
                      {note.title}
                    </h3>
                  </a>

                  {/* Subject Tag */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.bg}`}
                    >
                      {badge.icon}
                      {note.subject}
                    </span>
                  </div>

                  {/* Uploader & Upvote Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                     <span>
  {note.profiles?.full_name?.split(' ')[0] || 'Student'} - CpE{' '}
  {String(note.profiles?.year_level || '3').replace(/\D/g, '') || '3'}
</span>
                    </div>

                    <button
                      onClick={() => handleToggleUpvote(note.id, !!note.user_has_upvoted)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition ${
                        note.user_has_upvoted
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>{note.upvotes_count || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-xs">
              No notes found for this subject filter.
            </div>
          )}
        </div>

      </div>

      {/* Bottom Floating Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 py-2.5 px-6 flex justify-around items-center max-w-md mx-auto z-50">
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 text-blue-600 font-bold text-[11px]"
        >
          <FileText className="w-5 h-5" />
          <span>Browse</span>
        </Link>
        <Link
          href="/upload"
          className="flex flex-col items-center gap-0.5 text-slate-400 font-medium text-[11px] hover:text-slate-600 transition"
        >
          <Upload className="w-5 h-5" />
          <span>Upload</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-0.5 text-slate-400 font-medium text-[11px] hover:text-slate-600 transition"
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}

// Tree icon helper for Data Structures
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