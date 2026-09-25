'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [course, setCourse] = useState('BS Computer Engineering');
  const [yearLevel, setYearLevel] = useState('3rd');
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-2xl font-bold text-xl mb-2">
            N
          </div>
          <h1 className="text-2xl font-bold">Create Student Account</h1>
          <p className="text-sm text-slate-500">Share notes. Ace exams.</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Juan Dela Cruz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Course</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-600"
              readOnly
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Year Level</label>
            <div className="grid grid-cols-5 gap-2 text-center">
              {['1st', '2nd', '3rd', '4th', '5th'].map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setYearLevel(year)}
                  className={`py-2 rounded-xl border text-xs font-semibold ${
                    yearLevel === year
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-700 bg-white'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Upload ID photo placeholder */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 cursor-pointer hover:border-blue-500 transition">
            <div className="text-blue-600 font-semibold">Upload Student ID Photo</div>
            <p className="text-xs text-slate-400">JPG or PNG formats up to 5MB</p>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              I agree to the{' '}
              <span className="text-blue-600 font-medium">Terms of Use</span> and{' '}
              <span className="text-blue-600 font-medium">Academic Integrity Policy</span>
            </span>
          </label>

          {/* Admin Notice */}
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl p-3">
            <p className="font-semibold">Admin Approval Required</p>
            <p className="text-emerald-700">Your account status will remain "Pending" until an admin verifies your student ID photo.</p>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={!agreed}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition"
          >
            Submit Registration
          </button>
        </div>
      </div>
    </div>
  );
}