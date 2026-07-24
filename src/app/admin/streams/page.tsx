'use client'

import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

interface LiveStream {
  _id: string
  title: string
  streamKey: string
  type?: string
  externalUrl?: string
  isVisible: boolean
  createdAt: string
}

export default function AdminStreams() {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('rtmp')
  const [streamKey, setStreamKey] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/streams')
      const json = await res.json()
      setStreams(json)
    } catch (err) {
      console.error('Failed to fetch streams', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStreams()
  }, [fetchStreams])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title.trim(), 
          type,
          ...(type === 'rtmp' ? { streamKey: streamKey.trim() } : { externalUrl: externalUrl.trim() })
        }),
      })
      if (res.ok) {
        setTitle('')
        setStreamKey('')
        setExternalUrl('')
        setType('rtmp')
        setShowForm(false)
        toast.success('Stream created!')
        fetchStreams()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create stream')
      }
    } catch (err: any) {
      console.error('Failed to create stream', err)
      toast.error(err.message || 'Failed to create stream')
    } finally {
      setCreating(false)
    }
  }

  const toggleVisibility = async (stream: LiveStream) => {
    try {
      await fetch(`/api/admin/streams/${stream._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !stream.isVisible }),
      })
      fetchStreams()
    } catch (err) {
      console.error('Failed to toggle visibility', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stream?')) return
    try {
      await fetch(`/api/admin/streams/${id}`, { method: 'DELETE' })
      fetchStreams()
    } catch (err) {
      console.error('Failed to delete stream', err)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: '0.25rem' }}>Streams</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your live stream configurations.
          </p>
        </div>
        {streams.length === 0 ? (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Stream'}
          </button>
        ) : (
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(255, 60, 60, 0.1)', color: '#ff4d4d', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 500, border: '1px solid rgba(255, 60, 60, 0.2)' }}>
            Only one stream allowed. Delete existing stream to create a new one.
          </div>
        )}
      </div>

      {showForm && streams.length === 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Main Event Stream"
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Source Type</label>
                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{type === 'rtmp' ? 'Local RTMP Server' : 'External Link (YouTube, Vimeo, etc.)'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  
                  {isDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '0.5rem',
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      zIndex: 10,
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}>
                      <div 
                        onClick={() => { setType('rtmp'); setIsDropdownOpen(false); }}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          background: type === 'rtmp' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          color: type === 'rtmp' ? '#818cf8' : '#fff',
                          transition: 'background 0.2s',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = type === 'rtmp' ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}
                      >
                        Local RTMP Server
                      </div>
                      <div 
                        onClick={() => { setType('external'); setIsDropdownOpen(false); }}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          background: type === 'external' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          color: type === 'external' ? '#818cf8' : '#fff',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = type === 'external' ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}
                      >
                        External Link (YouTube, Vimeo, etc.)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {type === 'rtmp' ? (
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Stream Key (path in MediaMTX)</label>
                <input
                  type="text"
                  value={streamKey}
                  onChange={e => setStreamKey(e.target.value)}
                  placeholder="e.g., live/stream"
                  required
                  style={inputStyle}
                />
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>External Video URL</label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={e => setExternalUrl(e.target.value)}
                  placeholder="e.g., https://www.youtube.com/watch?v=..."
                  required
                  style={inputStyle}
                />
              </div>
            )}
            
            <div style={{ alignSelf: 'flex-start' }}>
              <button type="submit" className="btn-primary" disabled={creating} style={{ whiteSpace: 'nowrap' }}>
                {creating ? 'Creating...' : 'Create Stream'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading streams...</p>
        </div>
      ) : streams.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>No streams configured yet.</p>
          <p style={{ color: 'var(--text-secondary)' }}>Create a stream to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {streams.map((stream) => (
            <div key={stream._id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {stream.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {stream.type === 'external' ? (
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>External Link: </span>
                        <code style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                          <a href={stream.externalUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                            {stream.externalUrl}
                          </a>
                        </code>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Stream Key: </span>
                          <code style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>{stream.streamKey}</code>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>RTMP URL: </span>
                          <code style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>rtmp://localhost:1935/{stream.streamKey}</code>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginRight: '0.5rem',
                    backgroundColor: stream.isVisible ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    color: stream.isVisible ? 'var(--status-success)' : 'var(--text-muted)',
                    border: `1px solid ${stream.isVisible ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-light)'}`,
                  }}>
                    Status: {stream.isVisible ? 'Live' : 'Hidden'}
                  </div>
                  <button
                    onClick={() => toggleVisibility(stream)}
                    style={{
                      ...actionBtnStyle,
                      color: '#fff',
                      backgroundColor: stream.isVisible ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.8)',
                      borderColor: 'transparent',
                    }}
                  >
                    {stream.isVisible ? 'Hide' : 'Go Live'}
                  </button>
                  <button
                    onClick={() => handleDelete(stream._id)}
                    style={{ ...actionBtnStyle, color: 'var(--status-live)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid var(--border-light)',
  color: 'white',
  outline: 'none',
}

const actionBtnStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  background: 'transparent',
  border: '1px solid var(--border-light)',
  color: 'var(--text-secondary)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: '0.85rem',
  transition: 'all 0.2s',
}
