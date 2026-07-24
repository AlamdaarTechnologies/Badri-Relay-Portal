'use client'

import { useHeartbeat } from '@/lib/heartbeat'
import HLSPlayer from '@/components/player/HLSPlayer'
import ExternalPlayer from '@/components/player/ExternalPlayer'
import { useEffect, useState, useRef } from 'react'

interface StreamInfo {
  title: string
  type: string
  externalUrl?: string
}

/**
 * Extracts a YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

export default function LiveStream() {
  useHeartbeat()

  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stream, setStream] = useState<StreamInfo | null>(null)
  const lastStreamJson = useRef('')

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/user/stream-status')
      const data = await res.json()
      setIsLive(data.isLive)

      // Only update stream state if it actually changed — prevents player from remounting
      const newJson = JSON.stringify(data.stream)
      if (newJson !== lastStreamJson.current) {
        lastStreamJson.current = newJson
        setStream(data.stream)
      }
    } catch (error) {
      console.error('Failed to check stream status', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  const hlsUrl = process.env.NEXT_PUBLIC_HLS_URL || 'http://localhost:8000'
  const streamUrl = `${hlsUrl}/live/stream/index.m3u8`

  const renderPlayer = () => {
    if (!stream) return null

    if (stream.type === 'external' && stream.externalUrl) {
      const youtubeId = extractYouTubeId(stream.externalUrl)

      if (youtubeId) {
        return <ExternalPlayer videoId={youtubeId} title={stream.title} />
      }

      // Generic iframe fallback for non-YouTube external URLs
      return (
        <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#000' }}>
          <iframe
            src={stream.externalUrl}
            title={stream.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      )
    }

    // Default: RTMP via HLS
    return <HLSPlayer src={streamUrl} />
  }

  return (
    <div className="page-container">
      <div className="live-header-flex">
        <h1 className="heading-2">{stream?.title || 'Main Stream'}</h1>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          background: 'rgba(20,20,30,0.6)', 
          padding: '0.5rem 1rem', 
          borderRadius: 'var(--radius-xl)', 
          border: '1px solid var(--border-light)' 
        }}>
          <span className="live-dot" style={{ background: isLive ? 'var(--status-live)' : 'var(--text-muted)', boxShadow: isLive ? '0 0 10px var(--status-live)' : 'none' }}></span>
          <span style={{ fontWeight: 600, color: isLive ? 'var(--status-live)' : 'var(--text-muted)' }}>
            {isLive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        {loading ? (
          <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%', backgroundColor: '#000', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-secondary)' }}>Loading stream status...</p>
          </div>
        ) : isLive ? (
          renderPlayer()
        ) : (
          <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%', backgroundColor: '#111', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <p className="no-stream-text-1">Right now there is no stream currently.</p>
              <p className="no-stream-text-2">Please wait for the administrator to start the broadcast.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>About this stream</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          You are currently connected to the secure Badri Relay portal.
          Please do not close this window if you wish to continue watching.
        </p>
      </div>
    </div>
  )
}
