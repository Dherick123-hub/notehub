'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, User } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ProfileRole = {
  role: string | null;
};

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Helper to check user admin status
  const checkAdminRole = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle<ProfileRole>();

    if (profile && profile.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        void checkAdminRole(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        void checkAdminRole(currentUser.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link className="font-bold text-xl text-white flex items-center gap-2" href="/browse">
          NoteHub
        </Link>

        <div>
          {user ? (
            <div className="flex items-center gap-3 md:gap-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-2.5 py-1 md:px-3 md:py-1.5 rounded-md text-xs md:text-sm font-semibold transition flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Admin<span className="hidden sm:inline"> Panel</span>
                </Link>
              )}

              {/* REMOVED: "Browse" link was here */}

              <Link
                href="/profile"
                className="hidden md:inline-block text-sm font-medium text-gray-300 hover:text-white transition"
              >
                Profile
              </Link>

              <span className="hidden sm:inline-block text-xs md:text-sm text-gray-400 max-w-[140px] md:max-w-none truncate">
                {user.email}
              </span>

              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs md:text-sm transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link className="text-gray-300 hover:text-white text-sm" href="/login">
                Login
              </Link>
              <Link className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm transition" href="/register">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}