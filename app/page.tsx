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
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (!error && data) setNotes(data as unknown as Note[]);
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
      subject,
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
      fetchNotes();
    }

    setIsUploading(false);
  };

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

      {/* Feed List */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{note.title}</h3>
              <p className="text-sm text-gray-600">{note.subject} • Uploaded by {note.profiles?.full_name || 'Anonymous'}</p>
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
        ))}
      </div>
    </main>
  );
}