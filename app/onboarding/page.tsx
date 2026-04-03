'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OnboardingPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function createCat() {
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    await supabase.from('cats').insert({
      user_id: user.id,
      name: trimmed,
    })

    setLoading(false)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">

        <div className="text-center flex flex-col gap-2">
          <div className="text-5xl">🐱</div>
          <h1 className="text-xl font-bold">고양이 이름이 뭐예요?</h1>
          <p className="text-sm text-gray-500">건강일지에 사용할 이름을 알려주세요</p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createCat()}
            placeholder="예: 나비, 루이, 코코"
            autoFocus
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-emerald-400"
          />
          <button
            onClick={createCat}
            disabled={!name.trim() || loading}
            className="w-full py-4 rounded-xl bg-emerald-500 text-white font-semibold text-sm disabled:opacity-40 transition-all"
          >
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </div>

      </div>
    </div>
  )
}
