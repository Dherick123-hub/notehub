'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  Trash2, 
  Zap, 
  Cpu, 
  Binary, 
  Grid,
  FileText
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

export default function AllUploadsPage() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyUploads();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [searchQuery, selectedSubject, notes]);

  const fetchMyUploads = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch all notes uploaded by this user
    const { data: notesData, error } = await supabase
      .from('notes')
      .select('id, title, subject, created_at, file_url')
      .eq('uploader_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && notesData) {
      const { data: allUpvotes } = await supabase.from('upvotes').select('note_id');

      const formattedNotes = notesData.map((note) => {
        const count = allUpvotes?.filter((u) => u.note_id === note.id).length || 0;
        return {
          ...note,
          upvotes_count: count,
        };
      });

      setNotes(formattedNotes);
      setFilteredNotes(formattedNotes);
    }

    setIsLoading(false);
  };

  const filterNotes = () => {
    let result = notes;

    if (searchQuery.trim() !== '') {
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSubject !== 'All') {
      result = result.filter((n) =>
        n.subject.toLowerCase().includes(selectedSubject.toLowerCase())
      );
    }

    setFilteredNotes(result);
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    const { error } = await supabase.from('notes').delete().eq('id', noteId);

    if (!error) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } else {
      alert('Failed to delete note. Please try again.');
    }
  };

  const getSubjectBadge = (subjectName: string) => {
    const s = subjectName.toLowerCase();
    if (s.includes('data structure')) {
      return { bg: 'bg-emerald-100/70 text-emerald-700', icon: <TreeIcon className="w-3.5 h-3.5" /> };
    }
    if (s.includes('circuit')) {
      return { bg: 'bg-amber-100/70 text-amber-700', icon: <Zap className="w-3.5 h-3.5" /> };
    }
    if (s.includes('microprocessor') || s.includes('8086')) {
      return { bg: 'bg-purple-100/70 text-purple-700', icon: <Cpu className="w-3.5 h-3.5" /> };
    }
    if (s.includes('digital') || s.includes('logic')) {
      return { bg: 'bg-teal-100/70 text-teal-700', icon: <Grid className="w-3.5 h-3.5" /> };
    }
    return { bg: 'bg-blue-100/70 text-blue-700', icon: <Binary className="w-3.5 h-3.5" /> };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
        Loading Uploads...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-24">
      <div className="w-full max-w-md px-4 pt-6 space-y-5">

        {/* Top Header with Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="w-9 h-9 bg-white border border-slate-200/80 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            My Uploaded Notes
          </h1>
          <div className="w-9 h-9" /> {/* Spacer */}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search your notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
          />
        </div>

        {/* Quick Subject Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {['All', 'Circuits', 'Data Structures', 'Microprocessors', 'Digital Logic'].map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                selectedSubject === subj
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>

        {/* Uploads Count Banner */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-slate-500">
            Total Uploads
          </span>
          <span className="bg-blue-100 text-blue-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
            {filteredNotes.length}
          </span>
        </div>

        {/* Notes List */}
        <div className="space-y-3">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const badge = getSubjectBadge(note.subject);

              return (
                <div
                  key={note.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {note.title}
                    </h3>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-slate-300 hover:text-red-500 transition p-1 shrink-0"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.bg}`}
                    >
                      {badge.icon}
                      {note.subject}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {formatDate(note.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{note.upvotes_count || 0} Upvotes</span>
                    </div>

                    {note.file_url && (
                      <a
                        href={note.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        View File
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-xs">
              No uploaded notes found.
            </div>
          )}
        </div>

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