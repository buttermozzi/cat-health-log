import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 고양이 등록 여부 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: cat } = await supabase
          .from('cats')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        return NextResponse.redirect(new URL(cat ? next : '/onboarding', origin))
      }
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
}
