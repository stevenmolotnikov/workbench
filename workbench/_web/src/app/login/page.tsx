"use client";

import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const handleGitHubLogin = async () => {
    const supabase = createClient()
    
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/auth/callback`
    console.log('Login - using redirect URL:', redirectUrl)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: redirectUrl
      }
    })
    
    if (error) {
      console.error('OAuth error:', error)
    } else {
      console.log('OAuth initiated, redirect URL:', data?.url)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
    } else {
      console.log('Logged out successfully')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Sign in to continue</h1>
        <button 
          onClick={handleGitHubLogin}
          className="w-full px-4 py-2 text-white bg-gray-800 rounded hover:bg-gray-700"
        >
          Sign in with GitHub
        </button>
        <button 
          onClick={handleLogout}
          className="w-full px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
        >
          Logout (Debug)
        </button>
      </div>
    </div>
  )
}