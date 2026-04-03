import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: rows } = await supabase
    .from('push_subscriptions')
    .select('subscription')

  if (!rows?.length) {
    return NextResponse.json({ sent: 0 })
  }

  // KST = UTC+9 / 아침 8시 = UTC 23시, 저녁 9시 = UTC 12시
  const utcHour = new Date().getUTCHours()
  const isMorning = utcHour === 23

  const payload = JSON.stringify({
    title: '고양이 건강일지',
    body: isMorning
      ? '오늘 하루도 잘 부탁해요 🌞 기록 잊지 마세요!'
      : '오늘 기록 하셨나요? 🌙',
    url: '/',
  })

  let sent = 0
  const expired: string[] = []

  for (const row of rows) {
    try {
      await webpush.sendNotification(row.subscription, payload)
      sent++
    } catch (err: unknown) {
      // 410 Gone = 만료된 subscription → DB에서 삭제
      if (err instanceof Error && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
        expired.push(row.subscription.endpoint)
      }
    }
  }

  if (expired.length > 0) {
    for (const endpoint of expired) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('subscription->>endpoint', endpoint)
    }
  }

  return NextResponse.json({ sent, expired: expired.length })
}
