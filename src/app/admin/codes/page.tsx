'use client'

import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

interface AccessCode {
  _id: string
  code: string
  label: string | null
  inUse: boolean
  isDisabled: boolean
  createdAt: string
}

export default function AdminCodes() {
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  type SortColumn = 'code' | 'label' | 'status' | 'createdAt'
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/codes')
      const json = await res.json()
      setCodes(json)
    } catch (err) {
      console.error('Failed to fetch codes', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCodes()
    
    // Auto-refresh the codes list every 2 seconds to show live status updates
    const interval = setInterval(fetchCodes, 2000)
    return () => clearInterval(interval)
  }, [fetchCodes])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode, label: newLabel.trim() || null }),
      })
      if (res.ok) {
        setNewCode('')
        setNewLabel('')
        setShowForm(false)
        toast.success('ITS Number created!')
        fetchCodes()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create code')
      }
    } catch (err: any) {
      console.error('Failed to create code', err)
      toast.error(err.message || 'Failed to create code')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ITS Number?')) return
    try {
      await fetch(`/api/admin/codes/${id}`, { method: 'DELETE' })
      fetchCodes()
    } catch (err) {
      console.error('Failed to delete code', err)
    }
  }

  const handleToggleDisable = async (code: AccessCode) => {
    try {
      const res = await fetch(`/api/admin/codes/${code._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDisabled: !code.isDisabled })
      })
      if (res.ok) fetchCodes()
    } catch (err) {
      console.error('Failed to toggle disable', err)
    }
  }

  const handleForceLogout = async (id: string) => {
    if (!confirm('Are you sure you want to force logout this viewer?')) return
    try {
      const res = await fetch(`/api/admin/codes/${id}`, { method: 'POST' })
      if (res.ok) {
        toast.success('Viewer forced out')
        fetchCodes()
      }
    } catch (err) {
      console.error('Failed to force logout', err)
    }
  }

  const handleForceLogoutAll = async () => {
    if (!confirm('WARNING: Are you absolutely sure you want to forcefully logout ALL active viewers?')) return
    try {
      const res = await fetch('/api/admin/codes/force-logout-all', { method: 'POST' })
      if (res.ok) {
        toast.success('All viewers forced out')
        fetchCodes()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to force logout all')
      }
    } catch (err) {
      console.error('Failed to force logout all', err)
      toast.error('An error occurred')
    }
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyDirectLink = (code: string, id: string) => {
    const link = `${window.location.origin}/watch/${code}`
    navigator.clipboard.writeText(link)
    setCopiedId(`link-${id}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return <span style={{ opacity: 0.3, marginLeft: '0.25rem' }}>↕</span>
    return <span style={{ color: 'var(--accent-cyan)', marginLeft: '0.25rem' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: '0.25rem' }}>ITS Numbers</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Create and manage viewer ITS Numbers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Total Codes Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(59, 130, 246, 0.15)', // Blue tint
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#3b82f6', // Tailwind blue-500
            fontWeight: 600,
            fontSize: '0.9rem',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#3b82f6',
            }} />
            ITS Numbers : {codes.length}
          </div>

          {/* Active Viewer Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-xl)',
            background: codes.filter(c => c.inUse).length > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
            border: `1px solid ${codes.filter(c => c.inUse).length > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
            color: codes.filter(c => c.inUse).length > 0 ? 'var(--status-success)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: codes.filter(c => c.inUse).length > 0 ? 'var(--status-success)' : 'var(--text-muted)',
            }} />
            Active : {codes.filter(c => c.inUse).length}
          </div>
          <button
            onClick={handleForceLogoutAll}
            style={{ ...actionBtnStyle, padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-live)', borderColor: 'rgba(239, 68, 68, 0.3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-live)' }} />
            Force Logout All
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ New Code'}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                8-Digit Code (required)
              </label>
              <input
                type="text"
                value={newCode}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  if (val.length <= 8) setNewCode(val)
                }}
                placeholder="e.g., 12345678"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-light)',
                  color: 'white',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Label (optional)
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g., Main Hall Viewer..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-light)',
                  color: 'white',
                  outline: 'none',
                }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={creating || newCode.length !== 8} style={{ whiteSpace: 'nowrap' }}>
              {creating ? 'Creating...' : 'Create Code'}
            </button>
          </form>
        </div>
      )}

      {/* Search Bar */}
      {!loading && codes.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search by ITS Number or Label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-light)',
              color: 'white',
              outline: 'none',
              fontSize: '0.9rem',
            }}
          />
        </div>
      )}

      {/* Codes Table */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading codes...</p>
        </div>
      ) : codes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>No ITS Numbers yet.</p>
          <p style={{ color: 'var(--text-secondary)' }}>Click &quot;+ New Code&quot; to create one.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('code')}>
                  ITS Number {renderSortIndicator('code')}
                </th>
                <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('label')}>
                  Label {renderSortIndicator('label')}
                </th>
                <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                  Status {renderSortIndicator('status')}
                </th>
                <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('createdAt')}>
                  Created {renderSortIndicator('createdAt')}
                </th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes
                .filter((code) => {
                  const query = searchQuery.toLowerCase()
                  return code.code.includes(query) || (code.label && code.label.toLowerCase().includes(query))
                })
                .sort((a, b) => {
                  let valA: any = a[sortColumn]
                  let valB: any = b[sortColumn]
                  
                  if (sortColumn === 'status') {
                    const getStatus = (c: AccessCode) => c.isDisabled ? 2 : (c.inUse ? 1 : 0)
                    valA = getStatus(a)
                    valB = getStatus(b)
                  } else if (sortColumn === 'label') {
                    valA = (a.label || '').toLowerCase()
                    valB = (b.label || '').toLowerCase()
                  } else if (sortColumn === 'createdAt') {
                    valA = new Date(a.createdAt).getTime()
                    valB = new Date(b.createdAt).getTime()
                  }
                  
                  if (valA < valB) return sortDirection === 'asc' ? -1 : 1
                  if (valA > valB) return sortDirection === 'asc' ? 1 : -1
                  return 0
                })
                .map((code) => (
                <tr key={code._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={tdStyle}>
                    <code style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      letterSpacing: '0.15em',
                      color: 'var(--accent-cyan)',
                    }}>
                      {code.code}
                    </code>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: code.label ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {code.label || '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {code.isDisabled ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-xl)',
                        fontSize: '0.8rem', fontWeight: 600,
                        background: 'rgba(239, 68, 68, 0.15)', color: 'var(--status-live)'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-live)' }} />
                        Disabled
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-xl)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: code.inUse ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: code.inUse ? 'var(--status-success)' : 'var(--text-muted)',
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: code.inUse ? 'var(--status-success)' : 'var(--text-muted)',
                        }} />
                        {code.inUse ? 'Active' : 'Available'}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(code.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => copyCode(code.code, code._id)}
                        title="Copy code"
                        style={actionBtnStyle}
                      >
                        {copiedId === code._id ? '✓' : 'Copy'}
                      </button>
                      <button
                        onClick={() => copyDirectLink(code.code, code._id)}
                        title="Copy direct link"
                        style={actionBtnStyle}
                      >
                        {copiedId === `link-${code._id}` ? '✓ Link' : 'Link'}
                      </button>
                      <button
                        onClick={() => handleToggleDisable(code)}
                        style={{ ...actionBtnStyle, color: code.isDisabled ? 'var(--status-success)' : 'var(--text-secondary)' }}
                      >
                        {code.isDisabled ? 'Enable' : 'Disable'}
                      </button>
                      {code.inUse && !code.isDisabled && (
                        <button
                          onClick={() => handleForceLogout(code._id)}
                          style={{ ...actionBtnStyle, color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                        >
                          Force Logout
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(code._id)}
                        title="Delete code"
                        style={{ ...actionBtnStyle, color: 'var(--status-live)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '1rem 1.25rem',
  color: 'var(--text-muted)',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
}

const tdStyle: React.CSSProperties = {
  padding: '1rem 1.25rem',
}

const actionBtnStyle: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  background: 'transparent',
  border: '1px solid var(--border-light)',
  color: 'var(--text-secondary)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: '0.8rem',
  transition: 'all 0.2s',
}
