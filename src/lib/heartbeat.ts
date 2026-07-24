import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useHeartbeat() {
  const router = useRouter()

  useEffect(() => {
    let interval: NodeJS.Timeout

    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/auth/heartbeat', { method: 'POST' })
        // Only redirect if explicitly unauthorized (session expired/deleted/revoked).
        // 500 errors (like DB timeouts) should not kick the user out immediately.
        if (res.status === 401 || res.status === 403) {
          clearInterval(interval)
          router.push('/')
        }
      } catch (err) {
        console.error('Heartbeat failed', err)
      }
    }

    // Initial heartbeat
    sendHeartbeat()

    // Ping every 1 second
    interval = setInterval(sendHeartbeat, 1000)

    // Setup beforeunload to explicitly leave when closing tab
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable delivery during unload
      navigator.sendBeacon('/api/auth/leave')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Note: We deliberately do not send a leave request on standard component unmount.
      // This prevents React StrictMode (double-mounting in dev) from prematurely destroying the session,
      // and prevents client-side navigation unmounts from disrupting active streams.
      // Abandoned sessions are cleaned up by the server-side cron job after 2 minutes.
    }
  }, [router])
}
