import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function AcademicIntegrityPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className="p-2.5 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs transition"
            title="Back to Settings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight pr-7">
            Academic Integrity Policy
          </h1>
          
          <div className="w-9" />
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6 text-slate-700 text-sm leading-relaxed">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">NoteHub Guidelines</h2>
              <p className="text-xs text-slate-400">Last updated: September 2026</p>
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-base">1. Academic Honesty</h3>
            <p>
              NoteHub is designed to promote group study and peer learning. Users are expected to maintain high standards of academic integrity and comply with their respective institution&apos;s honor codes.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-base">2. Shared Content Standards</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Upload only your original study notes, summaries, or flashcards.</li>
              <li>Do not upload active exam questions, graded tests, or answer keys.</li>
              <li>Respect copyright laws regarding textbooks and course materials.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-base">3. Violations</h3>
            <p>
              Any shared content found to encourage cheating or copyright infringement will be removed immediately. Repeated violations may result in account termination.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}