'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

interface ExternalPlayerProps {
  videoId: string
  title: string
}

export default function ExternalPlayer({ videoId, title }: ExternalPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isRevealed, setIsRevealed] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const hideTimerRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      createPlayer()
      return
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScript = document.getElementsByTagName('script')[0]
    firstScript.parentNode?.insertBefore(tag, firstScript)

    window.onYouTubeIframeAPIReady = () => {
      createPlayer()
    }

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
      }
    }
  }, [videoId])

  const createPlayer = () => {
    if (playerRef.current) {
      try { playerRef.current.destroy() } catch {}
    }

    playerRef.current = new window.YT.Player('yt-player-frame', {
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
        cc_load_policy: 0, // Disable subtitles/closed captions
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          event.target.playVideo()
          setVolume(event.target.getVolume())
          
          // Bruteforce disable captions
          try {
            event.target.unloadModule('captions')
            event.target.unloadModule('cc')
            event.target.setOption('captions', 'track', {})
          } catch (e) {}
        },
        onStateChange: (event: any) => {
          const playing = event.data === 1 || event.data === 3
          setIsPlaying(playing)

          if (playing) {
            // Re-apply caption disabling just in case it loads late
            try {
              event.target.unloadModule('captions')
              event.target.unloadModule('cc')
              event.target.setOption('captions', 'track', {})
            } catch (e) {}
          }

          // Wait 5 seconds after first play for YouTube UI to fully auto-hide, then reveal
          if (event.data === 1 && !isRevealed) {
            // 5000ms total, update every 50ms = 100 steps of 1%
            let progress = 0
            const interval = setInterval(() => {
              progress += 1
              setLoadingProgress(Math.min(progress, 100))
              if (progress >= 100) {
                clearInterval(interval)
                setIsRevealed(true)
              }
            }, 50)
          }
        },
      },
    })
  }

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }, [isPlaying])

  useEffect(() => {
    resetHideTimer()
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }
  }, [isPlaying, resetHideTimer])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const togglePlay = () => {
    if (!playerRef.current) return
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo()
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
      playerRef.current.setVolume(volume || 50)
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return
    const val = parseInt(e.target.value)
    setVolume(val)
    playerRef.current.setVolume(val)
    if (val === 0) { playerRef.current.mute(); setIsMuted(true) }
    else { playerRef.current.unMute(); setIsMuted(false) }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    document.fullscreenElement ? document.exitFullscreen() : containerRef.current.requestFullscreen()
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (isPlaying) setShowControls(false) }}
      style={{
        position: 'relative',
        paddingTop: isFullscreen ? '0' : '56.25%',
        width: '100%',
        height: isFullscreen ? '100vh' : 'auto',
        borderRadius: isFullscreen ? '0' : 'var(--radius-md)',
        overflow: 'hidden',
        backgroundColor: '#000',
        cursor: showControls ? 'default' : 'none',
      }}
    >
      {/* YouTube iframe — standard size */}
      <div
        id="yt-player-frame"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* BLACK LOADING SCREEN — covers video for 5 seconds while YouTube UI auto-hides */}
      {!isRevealed && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#000',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#818cf8', // Indigo to match theme
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem', fontVariantNumeric: 'tabular-nums' }}>
              {loadingProgress}%
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Securing stream connection...</p>
          </div>
        </div>
      )}

      {/* Clickable overlay for double-click fullscreen (single click no longer pauses to prevent YT UI) */}
      <div
        onDoubleClick={toggleFullscreen}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          cursor: showControls ? 'pointer' : 'none',
        }}
      />

      {/* Custom Controls */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 6,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        opacity: showControls ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: showControls ? 'auto' : 'none',
      }}>

        {/* LIVE badge */}
        <div style={{
          background: 'var(--status-live)',
          color: '#fff',
          padding: '0.15rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}>
          LIVE
        </div>

        <div style={{ flex: 1 }} />

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={toggleMute} style={controlBtnStyle} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted || volume === 0 ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 5L6 9H2v6h4l5 4V5z" fill="white" />
                <line x1="23" y1="9" x2="17" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="17" y1="9" x2="23" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 5L6 9H2v6h4l5 4V5z" fill="white" />
                <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{ width: '70px', height: '4px', accentColor: '#fff', cursor: 'pointer' }}
          />
        </div>

        {/* Fullscreen */}
        <button onClick={toggleFullscreen} style={controlBtnStyle} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          {isFullscreen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
            </svg>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const controlBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.35rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  transition: 'background 0.2s',
}
