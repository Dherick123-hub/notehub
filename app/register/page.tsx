'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [course, setCourse] = useState('BS Computer Engineering');
  const [yearLevel, setYearLevel] = useState('3rd');

  // File state & preview
  const [idFile, setIdFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds 5MB limit.');
        return;
      }
      setErrorMessage(null);
      setIdFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (!idFile) {
      setErrorMessage('Please upload your Student ID photo.');
      setLoading(false);
      return;
    }

    try {
      // Parse yearLevel string (e.g., "3rd") to integer (3) for DB integer column
      const yearLevelInt = parseInt(yearLevel.replace(/\D/g, '')) || 3;

      // 1. Sign up user via Supabase Auth with metadata for the DB trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            course: course,
            year_level: yearLevelInt,
          },
        },
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error('Failed to create account.');

      // 2. Upload Student ID to Supabase Storage bucket ('student-ids')
      const fileExt = idFile.name.split('.').pop();
      const filePath = `${user.id}/id_card.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('student-ids')
        .upload(filePath, idFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL for stored ID photo
      const { data: publicUrlData } = supabase.storage
        .from('student-ids')
        .getPublicUrl(filePath);

      // 3. Upsert Profile record with status = 'Pending'
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          full_name: fullName,
          course: course,
          year_level: yearLevelInt,
          status: 'Pending',
          student_id_url: publicUrlData.publicUrl,
          avatar_url: publicUrlData.publicUrl,
        },
        { onConflict: 'id' }
      );

      if (profileError) throw profileError;

      // 4. Terminate session & purge client auth cache so pending user cannot access protected pages
      await supabase.auth.signOut();

      if (typeof window !== 'undefined') {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        }
      }

      // 5. Open Pop-up Modal instead of immediate redirect
      setShowSuccessModal(true);
    } catch (err: any) {
      // Print detailed logs to Developer Console (F12)
      console.error('Detailed Registration Error:', err);

      // Expose the precise error message, code, and details directly to UI
      const detailedError =
        err.details ||
        err.hint ||
        err.message ||
        (typeof err === 'object' ? JSON.stringify(err) : String(err));

      setErrorMessage(detailedError);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 relative">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
        <span className="text-xl font-bold text-blue-600">NoteHub</span>
        <div className="space-x-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">
            Login
          </Link>
          <Link href="/register" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-xl">
            Register
          </Link>
        </div>
      </header>

      {/* Main Form Box */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mt-12">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl text-white font-bold text-xl flex items-center justify-center mx-auto mb-3">
            N
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Student Account</h1>
          <p className="text-sm text-slate-500 mt-1">Share notes. Ace exams.</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 break-words">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Juan Dela Cruz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="student@national-u.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm"
            />
          </div>

          {/* Course */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium"
            />
          </div>

          {/* Year Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Year Level</label>
            <div className="grid grid-cols-5 gap-2">
              {['1st', '2nd', '3rd', '4th', '5th'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setYearLevel(level)}
                  className={`py-2 text-xs font-medium rounded-xl border transition-colors ${
                    yearLevel === level
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Clickable ID Upload Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID Verification</label>
            <label className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-600/50 hover:bg-slate-50 transition-colors group">
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="flex flex-col items-center space-y-2">
                  <img
                    src={previewUrl}
                    alt="ID Preview"
                    className="h-28 object-contain rounded-lg border border-slate-200"
                  />
                  <span className="text-xs text-blue-600 font-medium">Click to replace photo</span>
                </div>
              ) : (
                <div className="text-center py-2">
                  <Upload className="w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-blue-600 block">Upload Student ID Photo</span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">JPG or PNG formats up to 5MB</span>
                </div>
              )}
            </label>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="terms" className="text-xs text-slate-600">
              I agree to the <a href="#" className="text-blue-600 underline">Terms of Use</a> and <a href="#" className="text-blue-600 underline">Academic Integrity Policy</a>
            </label>
          </div>

          {/* Admin Notice */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-start space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800">
              <span className="font-semibold block">Admin Approval Required</span>
              Your account status will remain "Pending" until an admin verifies your student ID photo.
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-2xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Submit Registration</span>
            )}
          </button>
        </form>
      </div>

      {/* SUCCESS MODAL POP-UP */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-blue-50 p-3">
                <CheckCircle2 className="w-20 h-20 text-blue-600 stroke-[1.75]" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Registration successful!
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                Wait for Admin Approval
              </p>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-full transition shadow-md shadow-blue-500/25 text-base active:scale-95"
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}