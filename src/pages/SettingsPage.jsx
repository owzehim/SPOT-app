// src/pages/SettingsPage.jsx
//
// Full-screen settings page for logged-in members.
// Handles profile image upload + logout.

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UserCircle, ArrowLeft } from '@phosphor-icons/react'

// Reuse the same compression logic as registration
async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url)
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            resolve(blob)
          },
          'image/jpeg',
          quality
        )
      } catch (e) {
        URL.revokeObjectURL(url)
        reject(e)
      }
    }

    img.src = url
  })
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        navigate('/login')
        return
      }

      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (memberError) {
        console.error('load member error:', memberError)
      }

      setMember(memberData || null)
      setLoading(false)
    }

    load()
  }, [navigate])

  const handleProfileImageChange = async (file) => {
    if (!file || !member) return
    setError('')
    setUploading(true)

    try {
      const compressed = await compressImage(file, 800, 800, 0.75)

      const baseName =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${member.user_id}-${Date.now()}`

      const filePath = `avatars/${baseName}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, compressed, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error('Profile image upload failed:', uploadError)
        setError('프로필 사진 업로드에 실패했습니다. 다시 시도해 주세요.')
        return
      }

      const { data: publicData } = supabase
        .from('profile-images')
        .storage.getPublicUrl(filePath) // older versions; but you already use supabase.storage.from in registration
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">로딩 중...</p>
      </div>
    )
  }

  const initials = [member?.first_name, member?.last_name]
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .join('')

  const hasProfileImage = !!member?.profile_image_url

  return (
    <div
      className="flex flex-col bg-gray-50"
      style={{ minHeight: '100dvh' }}
    >
      {/* Header */}
      <div
        className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2 flex-shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={() => navigate('/member')}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>
        <h1 className="font-semibold text-gray-900 text-sm">설정</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 max-w-md mx-auto space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {hasProfileImage ? (
                <img
                  src={member.profile_image_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : initials ? (
                <span className="text-gray-600 font-bold text-2xl">
                  {initials}
                </span>
              ) : (
                <UserCircle size={42} weight="fill" color="#9ca3af" />
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {member?.first_name} {member?.last_name}
              </p>
              <p className="text-xs text-gray-400 mt-1">{member?.email}</p>
            </div>

            <p className="text-xs text-gray-500 text-center">
              프로필 사진을 변경하려면 아래 버튼을 눌러주세요.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files && e.target.files[0]
                if (!file) return
                setError('')
                setUploading(true)
                try {
                  const compressed = await compressImage(
                    file,
                    800,
                    800,
                    0.75
                  )

                  const baseName =
                    typeof crypto !== 'undefined' && crypto.randomUUID
                      ? crypto.randomUUID()
                      : `${member.user_id}-${Date.now()}`

                  const filePath = `avatars/${baseName}.jpg`

                  const { error: uploadError } = await supabase.storage
                    .from('profile-images')
                    .upload(filePath, compressed, {
                      contentType: 'image/jpeg',
                      upsert: false,
                    })

                  if (uploadError) {
                    console.error('Profile image upload failed:', uploadError)
                    setError(
                      '프로필 사진 업로드에 실패했습니다. 다시 시도해 주세요.'
                    )
                  } else {
                    const { data: publicData } = supabase.storage
                      .from('profile-images')
                      .getPublicUrl(filePath)

                    const url = publicData?.publicUrl || null

                    const { error: updateError } = await supabase
                      .from('members')
                      .update({ profile_image_url: url })
                      .eq('id', member.id)

                    if (updateError) {
                      console.error(
                        'Profile image DB update failed:',
                        updateError
                      )
                      setError(
                        '프로필 사진 저장에 실패했습니다. 다시 시도해 주세요.'
                      )
                    } else {
                      setMember((prev) =>
                        prev ? { ...prev, profile_image_url: url } : prev
                      )
                    }
                  }
                } catch (err) {
                  console.error(err)
                  setError('프로필 사진 변경 중 오류가 발생했습니다.')
                } finally {
                  setUploading(false)
                }
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
            >
              {uploading ? '업로드 중...' : '프로필 사진 변경'}
            </button>

            {error && (
              <p className="text-xs text-red-500 text-center mt-1">{error}</p>
            )}
          </div>

          {/* More settings sections can go here later */}

          {/* Logout */}
          <div className="pt-4 pb-6">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-sm font-semibold text-red-500 text-center"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}