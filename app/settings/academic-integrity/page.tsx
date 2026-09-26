'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileCheck, AlertTriangle, BookOpen } from 'lucide-react';

export default function AcademicIntegrityPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Back Link */}
        <Link 
          href="/settings" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Academic Integrity Policy
            </h1>
            <p className="text-xs text-slate-400">
              Guidelines for ethical note-sharing and collaboration on NoteHub
            </p>
          </div>
        </div>

        {/* Policy Content Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-slate-700 text-sm">
          
          <section className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h2>1. Intended Purpose</h2>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 pl-6">
              NoteHub is designed to foster collaborative learning through lecture notes, study guides, and original learning materials. Shared resources should supplement individual studying, not replace original work or breach institutional honor codes.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2>2. Prohibited Content</h2>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 pl-6">
              Users are strictly prohibited from uploading or sharing:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 pl-6 space-y-1">
              <li>Active exam questions, test banks, or quiz answers.</li>
              <li>Graded assignments, lab reports, or essays intended for individual submission.</li>
              <li>Materials explicitly protected by instructor copyright or non-disclosure requests.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <h2>3. Student Responsibility</h2>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 pl-6">
              You are individually responsible for verifying that sharing or accessing materials on NoteHub complies with your institution’s academic integrity policies.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}