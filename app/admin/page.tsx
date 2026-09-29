'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Check, X, UserCheck, Loader2, ArrowLeft, ShieldAlert, Download } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_ADMIN_EMAIL = 'jianncarloliwanag@gmail.com';

interface Profile {
  id: string;
  full_name: string;
  course: string;
  year_level: string;
  role: string;
  status: string;
  id_photo_url?: string;
  student_id_url?: string;
  student_ids?: string;
  id_picture?: string;
  id_url?: string;
  student_id_photo?: string;
  avatar_url?: string;
  created_at?: string;
  verified_at?: string;
  approved_by?: string;
}

export default function AdminApprovalPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // State to store active preview image URL for popup modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getImageUrl = (user: Profile) => {
    const rawPath =
      user.id_photo_url ||
      user.student_id_url ||
      user.student_ids ||
      user.id_picture ||
      user.id_url ||
      user.student_id_photo;

    if (!rawPath) return null;

    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
      return rawPath;
    }

    const cleanPath = rawPath.replace(/^(student-ids\/|student_ids\/|ids\/|\/)/, '');

    const { data } = supabase.storage
      .from('student-ids')
      .getPublicUrl(cleanPath);

    return data?.publicUrl || null;
  };

  useEffect(() => {
    const verifyAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAuthorized(false);
        return;
      }

      const isEmailAuthorized = user.email?.toLowerCase() === ALLOWED_ADMIN_EMAIL.toLowerCase();

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isRoleAuthorized = profile?.role === 'admin';

      if (isEmailAuthorized || isRoleAuthorized) {
        setAuthorized(true);
        fetchPendingUsers();
      } else {
        setAuthorized(false);
      }
    };

    verifyAdminAccess();
  }, []);

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

  const handleUpdateStatus = async (userId: string, newStatus: 'Approved' | 'Rejected') => {
    setActionLoading(userId);

    const { data: { user } } = await supabase.auth.getUser();

    const updatePayload: Record<string, any> = {
      status: newStatus,
      verified_at: new Date().toISOString(),
    };

    if (user?.id) {
      updatePayload.approved_by = user.id;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (!error) {
      setPendingUsers((prev) => prev.filter((item) => item.id !== userId));
    } else {
      alert('Failed to update status: ' + error.message);
    }
    setActionLoading(null);
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center max-w-sm w-full space-y-3">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            You do not have permission to access the admin approval portal.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 relative">
      <div className="max-w-xl mx-auto space-y-4">
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Header Block */}
        <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-blue-600" />
              Admin Account Approvals
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Verify student ID submissions and approve pending accounts.
            </p>
          </div>
          <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
            {pendingUsers.length} Pending
          </span>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading pending accounts...</span>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
            <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-800 text-sm">All caught up!</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">There are no pending account verification requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => {
              const imageUrl = getImageUrl(user);

              return (
                <div
                  key={user.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  {/* User Info */}
                  <div className="space-y-1 w-full sm:w-2/5">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{user.full_name || 'Unnamed Student'}</h3>
                    <p className="text-[11px] text-slate-500">{user.course || 'N/A'} • Year {user.year_level || 'N/A'}</p>
                    <span className="inline-block bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-200/60 uppercase">
                      STATUS: {user.status}
                    </span>
                  </div>

                  {/* ID Photo Thumbnail (Opens Modal on Click) */}
                  {imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(imageUrl)}
                      className="group relative block rounded-xl overflow-hidden border border-slate-200 h-16 w-28 shrink-0 bg-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <img
                        src={imageUrl}
                        alt="Student ID"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute inset-0 bg-black/40 text-white text-[9px] font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        View ID
                      </span>
                    </button>
                  ) : (
                    <div className="h-16 w-28 shrink-0 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                      No ID Uploaded
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => handleUpdateStatus(user.id, 'Rejected')}
                      disabled={actionLoading === user.id}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-semibold flex items-center justify-center gap-1 transition disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(user.id, 'Approved')}
                      disabled={actionLoading === user.id}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Preview Modal Popup */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button Header */}
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedImage(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ID Image Preview Container */}
            <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-[70vh] flex items-center justify-center bg-slate-950">
              <img
                src={selectedImage}
                alt="Enlarged Student ID"
                className="w-full h-auto max-h-[70vh] object-contain rounded-2xl"
              />
            </div>

            {/* Bottom Action Section */}
            <div>
              <a
                href={selectedImage}
                target="_blank"
                rel="noreferrer"
                download
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download / Open Full Size
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}