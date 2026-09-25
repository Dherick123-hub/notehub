'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Helper to check user admin status
  const checkAdminRole = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profile && profile.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        checkAdminRole(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        checkAdminRole(currentUser.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link className="font-bold text-xl text-white" href="/">
          NoteHub
        </Link>

        <div>
          {user ? (
            <div className="flex items-center gap-4">
              {/* Admin Panel Link - Rendered only when user role is 'admin' */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-3 py-1.5 rounded-md text-sm font-semibold transition flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Admin Panel
                </Link>
              )}

              <Link
                href="/profile"
                className="text-sm font-medium text-gray-300 hover:text-white transition"
              >
                Profile
              </Link>
              <span className="text-sm text-gray-400">{user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm transition cursor-pointer"
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