'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const HEALTH_OPTIONS = [
  { value: 'good',          label: '밥 먹음' },
  { value: 'appetite_loss', label: '밥 안 먹음' },
  { value: 'active',        label: '활발함' },
  { value: 'abnormal',      label: '평소와 달라요' },
]

const PLAY_OPTIONS = [0, 1, 2, 3]

export default function RecordPage() {
  const [catId, setCatId]   = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [health, setHealth] = useState<string | null>(null)
  const [play, setPlay]     = useState<number | null>(null)
  const [memo, setMemo]     = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: cat } = await supabase
        .from('cats')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!cat) {
        router.push('/onboarding')
        return
      }
      setCatId(cat.id)
      setCatName(cat.name)
    }
    init()
  }, [router])

  async function handleSave() {
    if (!catId || !health || play === null) return
    setSaving(true)

    const { error } = await supabase.from('records').insert({
      cat_id: catId,
      health_status: health,
      play_count: play,
      memo: memo || null,
    })

    setSaving(false)
    if (!error) setDone(true)
  }

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <div className="text-4xl">🐱</div>
      <p className="text-lg font-medium">오늘도 잘 봐줬어요!</p>
      <button
        onClick={() => { setDone(false); setHealth(null); setPlay(null); setMemo('') }}
        className="mt-4 px-6 py-2 rounded-full border border-gray-300 text-sm"
      >
        다시 기록하기
      </button>
      <Link href="/" className="text-sm text-gray-400 underline">
        홈으로
      </Link>
    </div>
  )

  return (
    <div className="max-w-sm mx-auto px-4 py-8 flex flex-col gap-6">

      <h1 className="text-lg font-semibold">
        {catName ? `오늘 ${catName}는요?` : '오늘 기록'}
      </h1>

      {/* 건강 상태 */}
      <section className="flex flex-col gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">건강 상태</p>
        <div className="grid grid-cols-2 gap-2">
          {HEALTH_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setHealth(opt.value)}
              className={`py-3 rounded-xl text-sm border transition-all ${
                health === opt.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* 놀이 횟수 */}
      <section className="flex flex-col gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">놀이 횟수</p>
        <div className="grid grid-cols-4 gap-2">
          {PLAY_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setPlay(n)}
              className={`py-3 rounded-xl text-sm border transition-all ${
                play === n
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            >
              {n === 3 ? '3회+' : `${n}회`}
            </button>
          ))}
        </div>
      </section>

      {/* 메모 */}
      <section className="flex flex-col gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">메모 (선택)</p>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="오늘 특이한 점이 있었나요?"
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm resize-none focus:outline-none focus:border-emerald-400"
        />
      </section>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={!health || play === null || saving || !catId}
        className="w-full py-4 rounded-xl bg-emerald-500 text-white font-semibold text-sm disabled:opacity-40 transition-all"
      >
        {saving ? '저장 중...' : '저장하기'}
      </button>

    </div>
  )
}
