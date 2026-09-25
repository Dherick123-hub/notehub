'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  full_name: string
  course: string
  year_level: number
  status: string
  id_photo_url: string | null
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchPendingUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setPendingUsers(data || [])
    }
    setLoading(false)
  }, [])

  const checkAdminAndFetch = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        setErrorMsg('Access denied. Admin privileges required.')
        setLoading(false)
        return
      }

      await fetchPendingUsers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setErrorMsg(message)
      setLoading(false)
    }
  }, [fetchPendingUsers, router])

  useEffect(() => {
    let isMounted = true

    const runCheck = async () => {
      if (!isMounted) return
      await checkAdminAndFetch()
    }

    void runCheck()

    return () => {
      isMounted = false
    }
  }, [checkAdminAndFetch])

  const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    setActionLoading(userId)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: newStatus,
          verified_at: new Date().toISOString(),
          approved_by: user?.id,
          id_photo_url: null,
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setPendingUsers((prev) => prev.filter((p) => p.id !== userId))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to update user status.'
      alert(`Error updating status: ${message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getImageUrl = (path: string | null) => {
    if (!path) return null
    const { data } = supabase.storage.from('id-photos').getPublicUrl(path)
    return data.publicUrl
  }

  if (loading) {
    return <div className="p-8 text-center text-black">Loading admin panel...</div>
  }

  if (errorMsg) {
    return <div className="p-8 text-center text-red-600 font-medium">{errorMsg}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Admin Approval Panel</h1>
        <p className="text-gray-500 mt-1">Review pending student account registrations</p>

        {pendingUsers.length === 0 ? (
          <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
            No pending account registrations at this time.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingUsers.map((user) => (
              <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{user.full_name}</h3>
                    <p className="text-sm text-gray-500">{user.course} — Year {user.year_level}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>

                {user.id_photo_url && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Submitted ID Photo:</p>
                    <a
                      href={getImageUrl(user.id_photo_url) || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline"
                    >
                      View full resolution image
                    </a>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleUpdateStatus(user.id, 'approved')}
                    disabled={actionLoading === user.id}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(user.id, 'rejected')}
                    disabled={actionLoading === user.id}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}