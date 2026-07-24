'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function WatchDirect() {
  const params = useParams()
  const code = params.code as string
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const authenticate = async () => {
      try {
        const res = await fetch('/api/auth/access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        const data = await res.json()

        if (!isMounted) return

        if (!res.ok) {
          setStatus('error')
          setErrorMsg(data.error || 'Failed to authenticate')
          return
        }

        // Success - redirect to live player
        router.push('/user/live')
        router.refresh()
      } catch (err: any) {
        if (!isMounted) return
        setStatus('error')
        setErrorMsg(err.message || 'Connection error')
      }
    }

    authenticate()

    return () => {
      isMounted = false
    }
  }, [code, router])

  return (
    <div className="centered-container">
      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '450px', textAlign: 'center' }}>
        {status === 'loading' ? (
          <div>
            <div className="live-dot" style={{ backgroundColor: 'var(--accent-blue)', marginBottom: '1rem', width: '20px', height: '20px' }}></div>
            <h2 className="heading-2">Authenticating...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Verifying your ITS Number.</p>
          </div>
        ) : (
          <div>
            <div style={{ color: 'var(--status-live)', marginBottom: '1rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 className="heading-2">Access Denied</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{errorMsg}</p>
            <Link href="/user" className="btn-primary">
              Enter Code Manually
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
