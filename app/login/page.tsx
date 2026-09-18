'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // 2. Fetch profile status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status, role')
        .eq('id', authData.user.id)
        .single()

      if (profileError) throw profileError

      // 3. Check account approval status
      if (profile.status === 'pending') {
        await supabase.auth.signOut()
        setErrorMsg('Your account is still pending admin approval. Please check back later.')
        return
      }

      if (profile.status === 'rejected' || profile.status === 'suspended') {
        await supabase.auth.signOut()
        setErrorMsg(`Your account has been ${profile.status}. Please contact an admin.`)
        return
      }

      // Redirect based on role
      if (profile.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid login credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Sign In to NoteHub</h2>
        <p className="text-sm text-gray-500 text-center mt-1">
          Peer-to-peer note sharing for CpE students
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}