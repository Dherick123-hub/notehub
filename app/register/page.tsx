'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, UserCheck, CheckCircle2, XCircle, AlertTriangle, Trash2, Check } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PendingUser {
  id: string;
  full_name: string;
  course: string;
  year_level: string;
  id_photo_url: string;
}

interface ReportedNote {
  id: string;
  note_id: string;
  reason: string;
  notes: {
    title: string;
    uploader_id: string;
  };
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'reported'>('pending');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [reportedNotes, setReportedNotes] = useState<ReportedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    if (activeTab === 'pending') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending');
      setPendingUsers(data || []);
    } else {
      const { data } = await supabase
        .from('reports')
        .select('*, notes(title, uploader_id)');
      setReportedNotes(data || []);
    }
    setIsLoading(false);
  };

  const handleUserApproval = async (userId: string, approve: boolean) => {
    await supabase
      .from('profiles')
      .update({ status: approve ? 'approved' : 'rejected' })
      .eq('id', userId);
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleReportAction = async (reportId: string, noteId: string, removeNote: boolean) => {
    if (removeNote) {
      await supabase.from('notes').delete().eq('id', noteId);
    }
    await supabase.from('reports').delete().eq('id', reportId);
    setReportedNotes((prev) => prev.filter((r) => r.id !== reportId));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-md space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Admin Portal</h1>
          </div>
          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
            Verified Admin
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-200/70 p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Accounts
          </button>
          <button
            onClick={() => setActiveTab('reported')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'reported'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reported Notes ({reportedNotes.length})
          </button>
        </div>

        {/* Pending Queue List */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Verification Queue ({pendingUsers.length})
            </h2>

            {pendingUsers.length > 0 ? (
              pendingUsers.map((user) => (
                <div key={user.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      {user.id_photo_url ? (
                        <img src={user.id_photo_url} alt="ID" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <UserCheck className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{user.full_name}</h3>
                      <p className="text-xs text-slate-500">{user.course} • Year {user.year_level}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleUserApproval(user.id, false)}
                      className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 hover:bg-red-100 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUserApproval(user.id, true)}
                      className="flex-1 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 border text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">All caught up — nothing to review right now</p>
              </div>
            )}
          </div>
        )}

        {/* Reported Notes List */}
        {activeTab === 'reported' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reports Queue ({reportedNotes.length})
            </h2>

            {reportedNotes.length > 0 ? (
              reportedNotes.map((report) => (
                <div key={report.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{report.notes?.title || 'Note item'}</h3>
                      <p className="text-xs text-red-500 font-semibold mt-0.5">Reason: {report.reason}</p>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleReportAction(report.id, report.note_id, false)}
                      className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleReportAction(report.id, report.note_id, true)}
                      className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition"
                    >
                      Remove Note
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 border text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">All caught up — nothing to review right now</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}