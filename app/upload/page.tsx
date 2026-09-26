'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Upload as UploadIcon, 
  User, 
  Image as ImageIcon, 
  FileCode, 
  Bookmark, 
  AlertTriangle,
  X 
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UploadPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Digital Logic');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const subjectsList = [
    'Digital Logic',
    'Data Structures',
    'Circuits 2',
    'Microprocessors',
    'Computer Architecture',
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
      } else {
        router.push('/login');
      }
    });
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!selectedFile) {
      setFile(null);
      return;
    }

    setFile(selectedFile);

    // Check if selected file is an image
    const isImageFile = selectedFile.type.startsWith('image/') || 
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(selectedFile.name);

    if (isImageFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFile(null);
  };

  const checkDuplicate = async (inputTitle: string, inputSubject: string) => {
    if (!inputTitle.trim()) {
      setIsDuplicate(false);
      return;
    }

    const { data } = await supabase
      .from('notes')
      .select('id')
      .ilike('title', inputTitle.trim())
      .ilike('subject', inputSubject.trim());

    if (data && data.length > 0) {
      setIsDuplicate(true);
    } else {
      setIsDuplicate(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    checkDuplicate(val, subject);
  };

  const handleSubjectChange = (e: React.ChangeEvent<SELECTElement>) => {
    const val = e.target.value;
    setSubject(val);
    checkDuplicate(title, val);
  };

  const executeUpload = async () => {
    if (!file || !title || !subject || !currentUserId) return;

    setIsUploading(true);
    setErrorMessage('');

    const bucketName = 'notes'; 
    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      setErrorMessage(`Storage Error: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('notes').insert({
      title: title.trim(),
      subject: subject.trim(),
      file_url: publicUrl,
      file_type: fileExt,
      uploader_id: currentUserId,
    });

    if (dbError) {
      setErrorMessage(`Database Error: ${dbError.message}`);
      setIsUploading(false);
    } else {
      router.push('/profile');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDuplicate) {
      executeUpload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-24">
      <div className="w-full max-w-md px-4 pt-8 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Note</h1>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">File Attachment</label>
            
            {!file ? (
              <label className="border-2 border-dashed border-blue-400 bg-blue-50/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/40 transition group shadow-sm min-h-[160px]">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <div className="w-12 h-12 bg-blue-100/80 rounded-2xl flex items-center justify-center text-blue-600 mb-2 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-blue-600">Choose Notes File</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  PDF, JPG, PNG, DOCX, PPTX — max 25 MB
                </p>
              </label>
            ) : (
              <div className="relative border-2 border-blue-500 rounded-2xl p-3 bg-white shadow-sm flex flex-col items-center justify-center min-h-[180px] overflow-hidden">
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 z-10 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-1 transition shadow"
                  title="Remove File"
                >
                  <X className="w-4 h-4" />
                </button>

                {previewUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="max-h-36 w-auto object-contain rounded-lg border border-slate-100 shadow-inner"
                    />
                    <p className="text-[11px] font-semibold text-slate-600 mt-2 truncate max-w-[240px]">
                      {file.name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-2 shadow font-bold text-xs uppercase">
                      {file.name.split('.').pop()}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 max-w-[220px] truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">Note Title</label>
            <div className="relative">
              <FileCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="K-Map Simplification Guide"
                value={title}
                onChange={handleTitleChange}
                className="w-full text-sm pl-10 pr-4 py-3 border border-slate-200/80 rounded-2xl text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">Subject Tag</label>
            <div className="relative">
              <Bookmark className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={subject}
                onChange={handleSubjectChange}
                className="w-full text-sm pl-10 pr-4 py-3 border border-slate-200/80 rounded-2xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none cursor-pointer"
              >
                {subjectsList.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {isDuplicate && (
            <div className="bg-amber-100/70 border border-amber-200/80 rounded-2xl p-4 text-amber-900 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900">Possible Duplicate Found</h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Another file has the same name in {subject}. Are you sure you want to upload this?
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDuplicate(false)}
                  className="bg-white text-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeUpload}
                  disabled={isUploading}
                  className="bg-amber-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl hover:bg-amber-900 transition disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Yes, Upload'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading || isDuplicate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl transition text-sm shadow-sm disabled:opacity-50"
          >
            {isUploading ? 'Uploading Note...' : 'Upload Note'}
          </button>
        </form>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 py-2.5 px-6 flex justify-around items-center max-w-md mx-auto z-50">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-slate-400 font-medium text-[11px] hover:text-slate-600 transition">
          <FileText className="w-5 h-5" />
          <span>Browse</span>
        </Link>
        <Link href="/upload" className="flex flex-col items-center gap-0.5 text-blue-600 font-bold text-[11px]">
          <UploadIcon className="w-5 h-5" />
          <span>Upload</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-slate-400 font-medium text-[11px] hover:text-slate-600 transition">
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}