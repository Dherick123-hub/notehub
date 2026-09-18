'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

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
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [totalUpvotes, setTotalUpvotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login'; // Or redirect wherever your login is
      return;
    }
    setUser(user);

    // Fetch user profile data (full name)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profileData) setProfile(profileData);

    // Fetch notes uploaded by this user
    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .eq('uploader_id', user.id)
      .order('created_at', { ascending: false });

    if (notesData) {
      setUserNotes(notesData);

      // Calculate total upvotes across all their notes
      const noteIds = notesData.map((n) => n.id);
      if (noteIds.length > 0) {
        const { count } = await supabase
          .from('upvotes')
          .select('*', { count: 'exact', head: true })
          .in('note_id', noteIds);

        setTotalUpvotes(count || 0);
      }
    }

    setLoading(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) {
      alert(error.message);
    } else {
      setUserNotes(userNotes.filter((note) => note.id !== noteId));
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-white">Loading profile...</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <Link href="/" className="bg-gray-700 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-600 transition">
          ← Back to Feed
        </Link>
      </div>

      {/* User Info Card */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'Student'}</h2>
        <p className="text-gray-600 text-sm mb-4">{user?.email}</p>
        
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{userNotes.length}</p>
            <p className="text-xs text-gray-600 uppercase font-semibold">Notes Uploaded</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{totalUpvotes}</p>
            <p className="text-xs text-gray-600 uppercase font-semibold">Total Upvotes Received</p>
          </div>
        </div>
      </div>

      {/* User's Uploaded Notes List */}
      <h3 className="text-xl font-bold text-white mb-4">My Uploaded Notes</h3>
      <div className="space-y-4">
        {userNotes.length > 0 ? (
          userNotes.map((note) => (
            <div key={note.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg text-gray-900">{note.title}</h4>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">{note.subject}</span> • Uploaded on {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={note.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-100 transition"
                >
                  View
                </a>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-100 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-white border border-gray-200 rounded-lg text-gray-500">
            You haven't uploaded any notes yet. Head over to the feed to share your first one!
          </div>
        )}
      </div>
    </main>
  );
}