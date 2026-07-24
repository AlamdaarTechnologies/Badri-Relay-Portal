'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface AdminAccount {
  _id: string
  email: string
  role: string
  label: string | null
  inUse: boolean
  createdAt: string
}

export default function AdminAccounts() {
  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/accounts')
      if (res.status === 403) {
        router.push('/admin')
        return
      }
      const json = await res.json()
      setAdmins(json)
    } catch (err) {
      console.error('Failed to fetch admins', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchAdmins()

    // Auto-refresh every 2 seconds
    const interval = setInterval(fetchAdmins, 2000)
    return () => clearInterval(interval)
  }, [fetchAdmins])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, label: newLabel.trim() || null }),
      })
      if (res.ok) {
        setNewEmail('')
        setNewPassword('')
        setNewLabel('')
        setShowForm(false)
        toast.success('Admin account created!')
        fetchAdmins()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create admin')
      }
    } catch (err: any) {
      console.error('Failed to create admin', err)
      toast.error(err.message || 'Failed to create admin')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin account?')) return
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Admin deleted')
        fetchAdmins()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete')
      }
    } catch (err) {
      console.error('Failed to delete admin', err)
    }
  }

  const handleForceLogout = async (id: string) => {
    if (!confirm('Are you sure you want to force logout this admin?')) return
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, { method: 'POST' })
      if (res.ok) {
        toast.success('Admin forced out')
        fetchAdmins()
      }
    } catch (err) {
      console.error('Failed to force logout admin', err)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: '0.25rem' }}>Admin Accounts</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Create and manage administrator credentials.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Admin'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Email (required)
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Password (required, min 6 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Label (optional)
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g., Operator Name..."
                style={inputStyle}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={creating || !newEmail || newPassword.length < 6} style={{ whiteSpace: 'nowrap' }}>
              {creating ? 'Creating...' : 'Create Admin'}
            </button>
          </form>
        </div>
      )}

      {/* Admins Table */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading admin accounts...</p>
        </div>
      ) : admins.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>No admin accounts yet.</p>
          <p style={{ color: 'var(--text-secondary)' }}>Click &quot;+ New Admin&quot; to create one.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Label</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {admin.email}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: admin.label ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {admin.label || '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-xl)',
                      fontSize: '0.8rem', fontWeight: 600,
                      background: admin.role === 'master' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                      color: admin.role === 'master' ? '#a855f7' : 'var(--text-muted)',
                    }}>
                      {admin.role === 'master' ? '👑 Master' : 'Admin'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-xl)',
                      fontSize: '0.8rem', fontWeight: 600,
                      background: admin.inUse ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                      color: admin.inUse ? 'var(--status-success)' : 'var(--text-muted)',
                    }}>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: admin.inUse ? 'var(--status-success)' : 'var(--text-muted)',
                      }} />
                      {admin.inUse ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {admin.inUse && (
                        <button
                          onClick={() => handleForceLogout(admin._id)}
                          style={{ ...actionBtnStyle, color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                        >
                          Force Logout
                        </button>
                      )}
                      {admin.role !== 'master' && (
                        <button
                          onClick={() => handleDelete(admin._id)}
                          title="Delete admin"
                          style={{ ...actionBtnStyle, color: 'var(--status-live)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        >
                          Delete
                        </button>
                      )}
                      {admin.role === 'master' && !admin.inUse && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                          Protected
                        </span>
                      )}
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid var(--border-light)',
  color: 'white',
  outline: 'none',
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
