'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

export default function UploadSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-6">
      <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
          <Check className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Note Uploaded Successfully!
          </h1>
          <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
            Your note is now live and visible to other students in the community. Thank you for sharing!
          </p>
        </div>

        <Link
          href="/browse"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition shadow-md shadow-blue-500/25 text-xs"
        >
          Back to Browse
        </Link>
      </div>
    </div>
  );
}