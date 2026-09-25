'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Check, X, ShieldAlert, UserCheck, Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Profile {
  id: string;
  full_name: string;
  course: string;
  year_level: number;
  status: string;
  student_id_url?: string;
  created_at?: string;
}

export default function AdminApprovalPage() {
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch all pending users
  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('status', 'Pending');

    if (!error && data) {
      setPendingUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Update account status (Approve or Reject)
  const handleUpdateStatus = async (userId: string, newStatus: 'Approved' | 'Rejected') => {
    setActionLoading(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);

    if (!error) {
      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
    } else {
      alert('Failed to update status: ' + error.message);
    }
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-7 h-7 text-blue-600" />
              Admin Account Approvals
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify student ID submissions and approve pending accounts.
            </p>
          </div>
          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
            {pendingUsers.length} Pending
          </span>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading pending accounts...</span>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">There are no pending account verification requests.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
              >
                {/* User Info */}
                <div className="space-y-1 w-full md:w-1/3">
                  <h3 className="font-bold text-slate-900 text-base">{user.full_name || 'Unnamed Student'}</h3>
                  <p className="text-xs text-slate-500">{user.course || 'N/A'} • Year {user.year_level || 'N/A'}</p>
                  <span className="inline-block bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-amber-200">
                    STATUS: {user.status}
                  </span>
                </div>

                {/* ID Photo Verification Preview */}
                {user.student_id_url ? (
                  <a
                    href={user.student_id_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block rounded-xl overflow-hidden border border-slate-200 h-24 w-40 bg-slate-100"
                  >
                    <img
                      src={user.student_id_url}
                      alt="Student ID"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute inset-0 bg-black/40 text-white text-[10px] font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      View Full ID
                    </span>
                  </a>
                ) : (
                  <div className="h-24 w-40 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    No ID Uploaded
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleUpdateStatus(user.id, 'Rejected')}
                    disabled={actionLoading === user.id}
                    className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(user.id, 'Approved')}
                    disabled={actionLoading === user.id}
                    className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Approve Account
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}