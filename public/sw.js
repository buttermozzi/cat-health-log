self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? '고양이 건강일지'
  const options = {
    body: data.body ?? '기록할 시간이에요 🐱',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url ?? '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existingClient = clientList.find((c) => c.url === url && 'focus' in c)
      if (existingClient) return existingClient.focus()
      return clients.openWindow(url)
    })
  )
})
