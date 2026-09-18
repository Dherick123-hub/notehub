'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  profiles: { full_name: string };
  upvotes_count?: number;
  user_has_upvoted?: boolean;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  useEffect(() => {
    fetchNotesAndUpvotes();
  }, []);

  const fetchNotesAndUpvotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    // Fetch notes with uploader details
    const { data: notesData, error: notesError } = await supabase
      .from('notes')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    // Fetch all upvotes
    const { data: upvotesData } = await supabase
      .from('upvotes')
      .select('note_id, user_id');

    if (!notesError && notesData) {
      const processedNotes = notesData.map((note) => {
        const noteUpvotes = upvotesData?.filter((u) => u.note_id === note.id) || [];
        const userHasUpvoted = user ? noteUpvotes.some((u) => u.user_id === user.id) : false;

        return {
          ...note,
          upvotes_count: noteUpvotes.length,
          user_has_upvoted: userHasUpvoted,
        };
      });

      setNotes(processedNotes as unknown as Note[]);
    }
  };

  const handleToggleUpvote = async (noteId: string, currentlyUpvoted: boolean) => {
    if (!currentUserId) {
      alert('Please log in to upvote notes.');
      return;
    }

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

    fetchNotesAndUpvotes();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !subject) return;

    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('You must be logged in to upload notes.');
      setIsUploading(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('notes-files')
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message);
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('notes-files')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('notes').insert({
      title,
      subject: subject.toUpperCase().trim(),
      file_url: publicUrl,
      file_type: fileExt,
      uploader_id: user.id,
    });

    if (dbError) {
      alert(dbError.message);
    } else {
      setTitle('');
      setSubject('');
      setFile(null);
      fetchNotesAndUpvotes();
    }

    setIsUploading(false);
  };

  const uniqueSubjects = Array.from(new Set(notes.map((n) => n.subject.toUpperCase())));

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          note.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'ALL' || note.subject.toUpperCase() === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <main className="max-w-4xl mx-auto p-6 text-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-white">NoteHub Feed</h1>

      {/* Upload Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Share a Note</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Subject (e.g., CPE 101)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
          <button
            type="submit"
            disabled={isUploading}
            className="bg-blue-600 text-white font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isUploading ? 'Uploading...' : 'Upload Note'}
          </button>
        </form>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-2.5 border border-gray-300 rounded-md text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="p-2.5 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Subjects</option>
          {uniqueSubjects.map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </select>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div key={note.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Upvote Button */}
                <button
                  onClick={() => handleToggleUpvote(note.id, !!note.user_has_upvoted)}
                  className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border transition ${
                    note.user_has_upvoted
                      ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xs">▲</span>
                  <span className="text-xs">{note.upvotes_count || 0}</span>
                </button>

                <div>
                  <h3 className="font-bold text-lg text-gray-900">{note.title}</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">{note.subject}</span> • Uploaded by {note.profiles?.full_name || 'Anonymous'}
                  </p>
                </div>
              </div>

              <a
                href={note.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-100 transition"
              >
                View Document
              </a>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-white border border-gray-200 rounded-lg text-gray-500">
            No notes found matching your filter criteria.
          </div>
        )}
      </div>
    </main>
  );
}