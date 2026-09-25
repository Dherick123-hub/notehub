'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function UploadErrorPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-6">
      <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Upload Failed
          </h1>
          <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
            Check your internet connection and try again. If the issue persists, please contact student support.
          </p>
        </div>

        <div className="w-full space-y-2">
          <Link
            href="/upload"
            className="w-full block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition shadow-md shadow-blue-500/25 text-xs"
          >
            Try Again
          </Link>
          <Link
            href="/browse"
            className="w-full block bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition hover:bg-slate-50 text-xs"
          >
            Go Back
          </Link>
        </div>
      </div>
    </div>
  );
}