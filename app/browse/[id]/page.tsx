'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Download, ThumbsUp, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, FileText } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type User = {
  id: string;
};

type NoteDetail = {
  id: string;
  title: string;
  subject: string;
  file_url?: string | null;
  uploader_id: string;
  uploader?: {
    full_name?: string;
    course?: string;
    year_level?: number;
  };
};

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const noteId = params.id;
  const router = useRouter();

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate content');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const loadNoteData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data: noteData } = await supabase
      .from('notes')
      .select('*, uploader:profiles(full_name, course, year_level)')
      .eq('id', noteId)
      .single();

    if (noteData) setNote(noteData as NoteDetail);

    const { data: votes } = await supabase.from('upvotes').select('*').eq('note_id', noteId);
    if (votes) {
      setUpvotes(votes.length);
      if (user) {
        setHasUpvoted(votes.some((v: { user_id: string }) => v.user_id === user.id));
      }
    }
  }, [noteId]);

  useEffect(() => {
    let isMounted = true;

    const runLoad = async () => {
      if (!isMounted) return;
      await loadNoteData();
    };

    void runLoad();

    return () => {
      isMounted = false;
    };
  }, [loadNoteData]);

  const handleUpvote = async () => {
    if (!currentUser || note?.uploader_id === currentUser.id) return;

    if (hasUpvoted) {
      await supabase.from('upvotes').delete().eq('note_id', noteId).eq('user_id', currentUser.id);
      setUpvotes((prev) => prev - 1);
      setHasUpvoted(false);
    } else {
      await supabase.from('upvotes').insert([{ note_id: noteId, user_id: currentUser.id }]);
      setUpvotes((prev) => prev + 1);
      setHasUpvoted(true);
    }
  };

  const submitReport = async () => {
    await supabase.from('reports').insert([
      { note_id: noteId, reporter_id: currentUser?.id, reason: reportReason }
    ]);
    setReportSubmitted(true);
    setIsReportOpen(false);
  };

  if (!note) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">Loading Note...</div>;

  const isOwner = currentUser?.id === note.uploader_id;
  const isDocumentExternal = note.file_url?.match(/\.(docx|pptx)$/i);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-20">
      <div className="w-full max-w-md space-y-4">
        
        {/* Top Report Toast Banner */}
        {reportSubmitted && (
          <div className="bg-emerald-500 text-white text-xs font-bold p-3 rounded-2xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Report submitted — our team will review this.</span>
            </div>
            <button onClick={() => setReportSubmitted(false)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Back Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 bg-white border rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Note Detail</h1>
        </div>

        {/* Note Metadata */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
            {note.subject}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
            {note.title}
          </h2>
          <p className="text-xs text-slate-500">
            By {note.uploader?.full_name || 'Student'} • {note.uploader?.course}
          </p>
        </div>

        {/* Document In-App Preview Container */}
        <div className="bg-slate-200/60 border border-slate-200 rounded-3xl h-64 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 truncate max-w-xs">{note.title}</span>
          <span className="text-[10px] text-slate-500">
            {isDocumentExternal ? '* DOCX and PPTX files will download to open externally.' : 'In-App PDF / Image Preview'}
          </span>
        </div>

        {/* Actions Row */}
        <div className="flex gap-3">
          <button
            onClick={handleUpvote}
            disabled={isOwner}
            className={`flex-1 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              isOwner
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : hasUpvoted
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Upvote • {upvotes}</span>
          </button>

          <a
            href={note.file_url ?? '#'}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
        </div>

        {/* Collapsible Report Section */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <button
            onClick={() => setIsReportOpen(!isReportOpen)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600"
          >
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              Report Issue
            </span>
            {isReportOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isReportOpen && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
              <label className="text-[11px] font-semibold text-slate-500">Select reason:</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
              >
                <option value="Wrong subject">Wrong subject tag</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Corrupted file">Corrupted file</option>
                <option value="Other">Other</option>
              </select>
              <button
                onClick={submitReport}
                className="w-full py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition"
              >
                Submit Report
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}