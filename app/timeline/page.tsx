'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const HEALTH_LABELS: Record<string, string> = {
  good: '밥 먹음',
  appetite_loss: '밥 안 먹음',
  active: '활발함',
  abnormal: '평소와 달라요',
  lethargy: '기력 없음',
  vomit: '구토',
  behavior_change: '행동 변화',
}

const ABNORMAL_STATUSES = new Set(['appetite_loss', 'abnormal', 'lethargy', 'vomit', 'behavior_change'])

type HealthRecord = {
  id: string
  recorded_at: string
  health_status: string
  play_count: number
  memo: string | null
}

function formatDateLabel(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[new Date(year, month - 1, day).getDay()]
  return `${month}월 ${day}일 (${weekday})`
}

export default function TimelinePage() {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: cat } = await supabase
        .from('cats')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!cat) {
        router.push('/onboarding')
        return
      }

      const { data } = await supabase
        .from('records')
        .select('*')
        .eq('cat_id', cat.id)
        .order('recorded_at', { ascending: false })
        .limit(90)

      setRecords(data ?? [])
      setLoading(false)
    }
    init()
  }, [router])

  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthRecords = records.filter(r => r.recorded_at.startsWith(thisMonth))
  const thisMonthAbnormal = thisMonthRecords.filter(r => ABNORMAL_STATUSES.has(r.health_status))

  const grouped: { [date: string]: HealthRecord[] } = {}
  for (const r of records) {
    if (!grouped[r.recorded_at]) grouped[r.recorded_at] = []
    grouped[r.recorded_at].push(r)
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="max-w-sm mx-auto px-4 py-8 flex flex-col gap-6 pb-24">
      <h1 className="text-xl font-bold">타임라인</h1>

      {/* 이번달 요약 */}
      <section className="rounded-2xl bg-blue-50 border border-blue-100 p-5 flex gap-8">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-blue-500">이번달 기록</p>
          <p className="text-2xl font-bold text-blue-700">
            {thisMonthRecords.length}
            <span className="text-sm font-normal text-blue-500 ml-1">일</span>
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-red-400">이상 증상</p>
          <p className="text-2xl font-bold text-red-500">
            {thisMonthAbnormal.length}
            <span className="text-sm font-normal text-red-400 ml-1">회</span>
          </p>
        </div>
      </section>

      {/* 기록 목록 */}
      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : sortedDates.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">아직 기록이 없어요</p>
      ) : (
        <div className="flex flex-col gap-5">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-xs text-gray-400 font-medium mb-2">{formatDateLabel(date)}</p>
              <div className="flex flex-col gap-2">
                {grouped[date].map(r => (
                  <div
                    key={r.id}
                    className={`rounded-xl border px-4 py-3 flex justify-between items-start ${
                      ABNORMAL_STATUSES.has(r.health_status)
                        ? 'border-red-100 bg-red-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-sm font-medium ${
                        ABNORMAL_STATUSES.has(r.health_status) ? 'text-red-700' : 'text-gray-700'
                      }`}>
                        {HEALTH_LABELS[r.health_status] ?? r.health_status}
                      </span>
                      {r.memo && <span className="text-xs text-gray-400">{r.memo}</span>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">놀이 {r.play_count}회</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 하단 탭 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <Link href="/" className="flex-1 py-4 text-center text-xs text-gray-500">홈</Link>
        <Link href="/timeline" className="flex-1 py-4 text-center text-xs text-blue-600 font-medium">타임라인</Link>
        <Link href="/report" className="flex-1 py-4 text-center text-xs text-gray-500">리포트</Link>
      </nav>
    </div>
  )
}
