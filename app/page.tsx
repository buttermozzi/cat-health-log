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

const ABNORMAL_STATUSES = ['appetite_loss', 'abnormal', 'lethargy', 'vomit', 'behavior_change']

type HealthRecord = {
  id: string
  recorded_at: string
  health_status: string
  play_count: number
  memo: string | null
}

function formatDate(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${parseInt(month)}월 ${parseInt(day)}일`
}

export default function HomePage() {
  const [catId, setCatId] = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [todayRecord, setTodayRecord] = useState<HealthRecord | null | undefined>(undefined)
  const [recentAbnormal, setRecentAbnormal] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const router = useRouter()

  const today = new Date().toISOString().slice(0, 10)

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

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)

      const [todayRes, abnormalRes] = await Promise.all([
        supabase
          .from('records')
          .select('*')
          .eq('cat_id', cat.id)
          .eq('recorded_at', today)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('records')
          .select('*')
          .eq('cat_id', cat.id)
          .in('health_status', ABNORMAL_STATUSES)
          .gte('recorded_at', sevenDaysAgoStr)
          .order('recorded_at', { ascending: false })
          .limit(5),
      ])

      setTodayRecord(todayRes.data)
      setRecentAbnormal(abnormalRes.data ?? [])
      setLoading(false)
    }

    init()
  }, [today, router])

  // 서비스 워커 등록 + 현재 알림 상태 확인
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {})

    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setPushEnabled(!!sub)
        })
      })
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function togglePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('이 브라우저는 푸시 알림을 지원하지 않아요.\niOS는 홈 화면에 추가 후 앱으로 실행해야 해요.')
      return
    }
    setPushLoading(true)

    try {
      const reg = await navigator.serviceWorker.ready

      if (pushEnabled) {
        const sub = await reg.pushManager.getSubscription()
        await sub?.unsubscribe()
        await fetch('/api/push/subscribe', { method: 'DELETE' })
        setPushEnabled(false)
      } else {
        const permission = await Notification.requestPermission()
        if (permission === 'denied') {
          alert('알림이 차단되어 있어요. 기기 설정에서 알림을 허용해주세요.')
          setPushLoading(false)
          return
        }
        if (permission !== 'granted') {
          setPushLoading(false)
          return
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
        if (res.ok) {
          setPushEnabled(true)
        } else {
          alert('알림 등록에 실패했어요. 다시 시도해주세요.')
        }
      }
    } catch (err) {
      alert(`오류가 발생했어요: ${err instanceof Error ? err.message : String(err)}`)
    }

    setPushLoading(false)
  }

  const [year, month, day] = today.split('-').map(Number)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[new Date(year, month - 1, day).getDay()]
  const todayLabel = `${month}월 ${day}일 (${weekday})`

  return (
    <div className="max-w-sm mx-auto px-4 py-8 flex flex-col gap-6 pb-24">

      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-400">{todayLabel}</p>
          <h1 className="text-xl font-bold mt-1">
            {catName ? `${catName}의 건강일지` : '건강일지'}
          </h1>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={togglePush}
            disabled={pushLoading}
            title={pushEnabled ? '알림 끄기' : '알림 받기'}
            className={`text-lg transition-opacity ${pushLoading ? 'opacity-40' : ''}`}
          >
            {pushEnabled ? '🔔' : '🔕'}
          </button>
          <button onClick={signOut} className="text-xs text-gray-400">
            로그아웃
          </button>
        </div>
      </div>

      {/* 오늘 기록 현황 */}
      <section className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 flex flex-col gap-3">
        <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">오늘 기록</p>
        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : todayRecord ? (
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-emerald-700">
              {HEALTH_LABELS[todayRecord.health_status] ?? todayRecord.health_status}
            </p>
            <p className="text-sm text-gray-500">
              놀이 {todayRecord.play_count}회{todayRecord.memo ? ` · ${todayRecord.memo}` : ''}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">아직 오늘 기록이 없어요</p>
        )}
        <Link
          href="/record"
          className="mt-1 w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm text-center transition-all hover:bg-emerald-600"
        >
          {todayRecord ? '다시 기록하기' : '기록하기'}
        </Link>
      </section>

      {/* 최근 이상 증상 */}
      <section className="flex flex-col gap-3">
        <p className="text-xs text-gray-400 uppercase tracking-wide">최근 7일 이상 증상</p>
        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : recentAbnormal.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">이상 증상이 없었어요 🐱</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentAbnormal.map(r => (
              <div
                key={r.id}
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 flex justify-between items-center"
              >
                <span className="text-sm font-medium text-red-700">
                  {HEALTH_LABELS[r.health_status] ?? r.health_status}
                </span>
                <span className="text-xs text-gray-400">{formatDate(r.recorded_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 하단 탭 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <Link href="/" className="flex-1 py-4 text-center text-xs text-emerald-600 font-medium">홈</Link>
        <Link href="/timeline" className="flex-1 py-4 text-center text-xs text-gray-500">타임라인</Link>
        <Link href="/report" className="flex-1 py-4 text-center text-xs text-gray-500">리포트</Link>
      </nav>
    </div>
  )
}
