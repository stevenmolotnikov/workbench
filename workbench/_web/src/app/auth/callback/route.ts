// import { NextResponse } from 'next/server'
// // The client you created from the Server-Side Auth instructions
// import { createClient } from '@/utils/supabase/server'

// export async function GET(request: Request) {
//   const { searchParams, origin } = new URL(request.url)
//   const code = searchParams.get('code')
//   // if "next" is in param, use it as the redirect URL
//   let next = searchParams.get('next') ?? '/workbench'
//   if (!next.startsWith('/')) {
//     // if "next" is not a relative URL, use the default
//     next = '/workbench'
//   }

//   if (code) {
//     const supabase = await createClient()
//     const { error } = await supabase.auth.exchangeCodeForSession(code)
//     console.log('Auth callback - exchangeCodeForSession:', { error, code: code?.substring(0, 10) + '...' })
    
//     if (!error) {
//       // Check if user was actually created
//       const { data: { user } } = await supabase.auth.getUser()
//       console.log('Auth callback - user after exchange:', user?.email)
      
//       const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
//       const isLocalEnv = process.env.NODE_ENV === 'development'
//       if (isLocalEnv) {
//         // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
//         return NextResponse.redirect(`${origin}${next}`)
//       } else if (forwardedHost) {
//         return NextResponse.redirect(`https://${forwardedHost}${next}`)
//       } else {
//         return NextResponse.redirect(`${origin}${next}`)
//       }
//     } else {
//       console.error('Auth callback error:', error)
//     }
//   }

//   // return the user to an error page with instructions
//   return NextResponse.redirect(`${origin}/auth/auth-code-error`)
// }

import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}