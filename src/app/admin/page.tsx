'use client'

import { useEffect, useState } from 'react'

interface Analytics {
  totalCodes: number
  activeSessions: number
  activeCodesCount: number
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to fetch analytics', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const cards = data
    ? [
        { label: 'Total ITS Numbers', value: data.totalCodes, color: 'var(--accent-blue)' },
        { label: 'Active Viewers', value: data.activeSessions, color: 'var(--status-success)' },
        { label: 'Codes In Use', value: data.activeCodesCount, color: 'var(--accent-purple)' },
      ]
    : []

  return (
    <div>
      <h1 className="heading-1" style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        Real-time overview of your streaming portal.
      </p>

      {loading ? (
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="glass-panel"
              style={{
                flex: 1,
                height: '140px',
                animation: 'pulse 1.5s ease-in-out infinite',
                opacity: 0.4,
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {cards.map((card) => (
            <div
              key={card.label}
              className="glass-panel"
              style={{
                padding: '1.75rem',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  background: card.color,
                  borderRadius: '4px 0 0 4px',
                }}
              />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.label}
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, color: card.color }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Stream Status Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Stream Configuration</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>MediaMTX HLS URL</p>
            <code style={{
              display: 'block',
              padding: '0.75rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              color: 'var(--accent-cyan)',
              wordBreak: 'break-all',
            }}>
              {process.env.NEXT_PUBLIC_HLS_URL || 'http://localhost:8000'}
            </code>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>OBS RTMP Target</p>
            <code style={{
              display: 'block',
              padding: '0.75rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              color: 'var(--accent-cyan)',
              wordBreak: 'break-all',
            }}>
              rtmp://localhost:1935/live/stream
            </code>
          </div>
        </div>
      </div>

      {/* Quick Help */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Start Guide</h2>
        <ol style={{ color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '1.25rem' }}>
          <li>Start <strong style={{ color: 'var(--text-primary)' }}>MediaMTX</strong> on your local PC.</li>
          <li>Open <strong style={{ color: 'var(--text-primary)' }}>OBS Studio</strong> and set the stream URL to <code style={{ color: 'var(--accent-cyan)' }}>rtmp://localhost:1935/live/stream</code>.</li>
          <li>Go to <strong style={{ color: 'var(--text-primary)' }}>ITS Numbers</strong> and create codes for your viewers.</li>
          <li>Share the viewer portal link and ITS Number with authorized viewers.</li>
          <li>Start streaming in OBS — viewers will see it live!</li>
        </ol>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
