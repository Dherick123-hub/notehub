'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [course, setCourse] = useState('BSCpE')
  const [yearLevel, setYearLevel] = useState('1')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [idPhoto, setIdPhoto] = useState<File | null>(null)
  
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('')
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please upload an image in JPG or PNG format only.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds 5MB limit. Please upload a smaller image.')
      return
    }

    setIdPhoto(file)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!idPhoto) {
      setErrorMsg('Please attach your Student ID photo for account verification.')
      return
    }

    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            course,
            year_level: parseInt(yearLevel),
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to register user account.')

      const fileExt = idPhoto.name.split('.').pop()
      const filePath = `${authData.user.id}/student-id.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('id-photos')
        .upload(filePath, idPhoto, { upsert: true })

      if (uploadError) throw uploadError

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ id_photo_url: filePath })
        .eq('id', authData.user.id)

      if (profileError) throw profileError

      setSuccessMsg(
        'Registration submitted! Your account is currently pending manual admin approval before you can log in.'
      )
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during registration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Create NoteHub Account</h2>
        <p className="text-sm text-gray-500 text-center mt-1">
          Peer-to-peer note sharing for CpE students
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Juan Dela Cruz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course</label>
              <input
                type="text"
                required
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year Level</label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </select>
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700">Student ID Photo</label>
            <p className="text-xs text-gray-500 mb-1">Upload JPG/PNG photo only (Max 5MB)</p>
            <input
              type="file"
              accept="image/jpeg, image/png, image/jpg"
              required
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Register Account'}
          </button>
        </form>
      </div>
    </div>
  )
}