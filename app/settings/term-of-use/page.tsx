'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Shield, UserCheck, AlertTriangle } from 'lucide-react';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
        {/* Header Back Button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <Link
            href="/profile"
            className="p-2 -ml-2 text-slate-400 hover:text-slate-700 transition rounded-xl hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Terms of Use</h1>
          <div className="w-9" />
        </div>

        {/* Content */}
        <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
          <p className="text-xs text-slate-400">
            Last updated: September 2026
          </p>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2>1. Acceptance of Terms</h2>
            </div>
            <p className="pl-6 text-xs text-slate-500">
              By accessing and using NoteHub, you agree to comply with and be bound by these Terms of Use. NoteHub is designed specifically for students and faculty of NU Baliwag (CpE) to share academic materials and study guides.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h2>2. Account Responsibilities</h2>
            </div>
            <p className="pl-6 text-xs text-slate-500">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account. You must provide accurate and complete registration information.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Shield className="w-4 h-4 text-blue-600" />
              <h2>3. Acceptable Use & Sharing</h2>
            </div>
            <p className="pl-6 text-xs text-slate-500">
              Users may only upload study notes, review materials, and educational resource documents that they have the right to share. Uploading unauthorized exams, copyrighted textbooks, or malicious files is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <h2>4. Termination & Moderation</h2>
            </div>
            <p className="pl-6 text-xs text-slate-500">
              NoteHub administrators reserve the right to remove any content or suspend accounts that violate our policies, academic integrity rules, or community standards.
            </p>
          </section>
        </div>

        {/* Bottom Back Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Link
            href="/profile"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-2xl text-xs transition"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
}