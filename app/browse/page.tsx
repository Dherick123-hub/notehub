'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Search, FileText, ThumbsUp, ArrowRight } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type RawNoteResponse = {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  uploader?: {
    full_name?: string;
    course?: string;
  } | null;
  upvotes?: { count: number }[];
};

type Note = {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  uploader?: {
    full_name?: string;
    course?: string;
  } | null;
  upvotes_count: number;
};

export default function BrowsePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotes() {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select(`
          id,
          title,
          subject,
          created_at,
          uploader:profiles(full_name, course),
          upvotes(count)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formattedNotes = (data as unknown as RawNoteResponse[]).map((item) => ({
          ...item,
          upvotes_count: item.upvotes?.[0]?.count || 0,
        }));
        setNotes(formattedNotes);
      }
      setLoading(false);
    }

    void fetchNotes();
  }, []);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-24">
      <div className="w-full max-w-md space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Browse Notes</h1>
          <p className="text-xs text-slate-500">Explore shared reviewer notes from students</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Digital Logic', 'Data Structures', 'Software Design', 'Signals'].map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSubject === subject
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No notes found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <Link
                key={note.id}
                href={`/browse/${note.id}`}
                className="block bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-400 transition shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider mb-1">
                      {note.subject}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 leading-snug">{note.title}</h2>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>By {note.uploader?.full_name || 'Student'}</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-600">
                    <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>{note.upvotes_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}