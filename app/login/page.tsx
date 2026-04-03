'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function sendOtp() {
    if (!email) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)

    if (error) {
      setError('이메일 전송에 실패했어요. 다시 시도해주세요.')
      return
    }
    setStep('otp')
  }

  async function verifyOtp() {
    if (otp.length !== 6) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    setLoading(false)

    if (error) {
      setError('코드가 맞지 않아요. 다시 확인해주세요.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: cat } = await supabase
      .from('cats')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    router.push(cat ? '/' : '/onboarding')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">

        <div className="text-center flex flex-col gap-2">
          <div className="text-5xl">🐱</div>
          <h1 className="text-xl font-bold">나비 건강일지</h1>
          <p className="text-sm text-gray-500">
            {step === 'email'
              ? '이메일을 입력하면 인증코드를 보내드려요'
              : `${email}로 보낸 6자리 코드를 입력해주세요`}
          </p>
        </div>

        {step === 'email' ? (
          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
              placeholder="이메일 주소"
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={sendOtp}
              disabled={!email || loading}
              className="w-full py-4 rounded-xl bg-emerald-500 text-white font-semibold text-sm disabled:opacity-40 transition-all"
            >
              {loading ? '전송 중...' : '인증코드 받기'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              placeholder="6자리 코드"
              inputMode="numeric"
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-center tracking-[0.5em] focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={verifyOtp}
              disabled={otp.length !== 6 || loading}
              className="w-full py-4 rounded-xl bg-emerald-500 text-white font-semibold text-sm disabled:opacity-40 transition-all"
            >
              {loading ? '확인 중...' : '로그인'}
            </button>
            <button
              onClick={() => { setStep('email'); setOtp(''); setError('') }}
              className="text-sm text-gray-400 text-center py-1"
            >
              이메일 다시 입력하기
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      </div>
    </div>
  )
}
