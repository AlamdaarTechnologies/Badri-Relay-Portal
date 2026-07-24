'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleLeave = async () => {
    try {
      await fetch('/api/auth/leave', { method: 'POST' })
      router.push('/')
    } catch (err) {
      console.error(err)
      router.push('/')
    }
  }

  return (
    <div>
      <nav className="user-nav">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
          <Link href="/user/live" className="text-gradient" style={{ fontWeight: 700, fontSize: '1.25rem' }}>
            Badri Relay
          </Link>
          
          <button onClick={handleLeave} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
            Leave Stream
          </button>
        </div>
      </nav>

      {children}
    </div>
  )
}
