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

const PERIODS = [
  { label: '7일', days: 7 },
  { label: '14일', days: 14 },
  { label: '30일', days: 30 },
]

export default function ReportPage() {
  const [catId, setCatId] = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [period, setPeriod] = useState(7)
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  // 유저 + 고양이 초기화
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

  // 기간 변경 시 기록 재조회
  useEffect(() => {
    if (!catId) return

    async function fetchRecords() {
      setLoading(true)
      const from = new Date()
      from.setDate(from.getDate() - period)
      const fromStr = from.toISOString().slice(0, 10)

      const { data } = await supabase
        .from('records')
        .select('*')
        .eq('cat_id', catId)
        .gte('recorded_at', fromStr)
        .order('recorded_at', { ascending: false })

      setRecords(data ?? [])
      setLoading(false)
    }
    fetchRecords()
  }, [catId, period])

  const abnormalRecords = records.filter(r => ABNORMAL_STATUSES.has(r.health_status))

  const symptomCounts: { [key: string]: number } = {}
  for (const r of abnormalRecords) {
    symptomCounts[r.health_status] = (symptomCounts[r.health_status] ?? 0) + 1
  }

  const avgPlay =
    records.length > 0
      ? (records.reduce((sum, r) => sum + r.play_count, 0) / records.length).toFixed(1)
      : '-'

  function buildReportText() {
    const lines = [
      `[${catName} 건강 리포트 — 최근 ${period}일]`,
      `기록 일수: ${records.length}일`,
      `이상 증상: ${abnormalRecords.length}회`,
      `평균 놀이 횟수: ${avgPlay}회`,
    ]

    if (Object.keys(symptomCounts).length > 0) {
      lines.push('')
      lines.push('< 증상 요약 >')
      for (const [k, v] of Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])) {
        lines.push(`• ${HEALTH_LABELS[k] ?? k}: ${v}회`)
      }
    }

    if (abnormalRecords.length > 0) {
      lines.push('')
      lines.push('< 이상 증상 기록 >')
      for (const r of abnormalRecords) {
        const label = HEALTH_LABELS[r.health_status] ?? r.health_status
        const memo = r.memo ? ` (${r.memo})` : ''
        lines.push(`${r.recorded_at} · ${label}${memo}`)
      }
    }

    return lines.join('\n')
  }

  async function copyReport() {
    await navigator.clipboard.writeText(buildReportText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-8 flex flex-col gap-6 pb-24">
      <h1 className="text-xl font-bold">병원 리포트</h1>

      {/* 기간 선택 */}
      <section className="flex flex-col gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">기간 선택</p>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${
                period === p.days
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <>
          {/* 요약 카드 */}
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex flex-col gap-1">
              <p className="text-xs text-gray-400">기록 일수</p>
              <p className="text-2xl font-bold text-gray-700">
                {records.length}
                <span className="text-sm font-normal text-gray-400 ml-0.5">일</span>
              </p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex flex-col gap-1">
              <p className="text-xs text-red-400">이상 증상</p>
              <p className="text-2xl font-bold text-red-600">
                {abnormalRecords.length}
                <span className="text-sm font-normal text-red-400 ml-0.5">회</span>
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex flex-col gap-1">
              <p className="text-xs text-blue-400">평균 놀이</p>
              <p className="text-2xl font-bold text-blue-600">
                {avgPlay}
                <span className="text-sm font-normal text-blue-400 ml-0.5">회</span>
              </p>
            </div>
          </section>

          {/* 증상 상세 */}
          {Object.keys(symptomCounts).length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">증상 상세</p>
              <div className="flex flex-col gap-2">
                {Object.entries(symptomCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, count]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 flex justify-between"
                    >
                      <span className="text-sm font-medium text-red-700">
                        {HEALTH_LABELS[key] ?? key}
                      </span>
                      <span className="text-sm text-red-500">{count}회</span>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {records.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">해당 기간에 기록이 없어요</p>
          )}

          {/* 공유 버튼 */}
          <section className="flex flex-col gap-2">
            <button
              onClick={copyReport}
              disabled={records.length === 0}
              className="w-full py-4 rounded-xl bg-emerald-500 text-white font-semibold text-sm transition-all hover:bg-emerald-600 disabled:opacity-40"
            >
              {copied ? '복사 완료!' : '리포트 복사하기'}
            </button>
            <p className="text-xs text-gray-400 text-center">복사 후 수의사 선생님께 붙여넣기 해주세요</p>
          </section>
        </>
      )}

      {/* 하단 탭 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <Link href="/" className="flex-1 py-4 text-center text-xs text-gray-500">홈</Link>
        <Link href="/timeline" className="flex-1 py-4 text-center text-xs text-gray-500">타임라인</Link>
        <Link href="/report" className="flex-1 py-4 text-center text-xs text-emerald-600 font-medium">리포트</Link>
      </nav>
    </div>
  )
}
