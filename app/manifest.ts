import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '고양이 건강일지',
    short_name: '건강일지',
    description: '고양이 건강/행동 기록 앱',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
