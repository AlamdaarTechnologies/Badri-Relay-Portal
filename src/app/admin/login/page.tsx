'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    sessionStorage.removeItem('admin_active')
    sessionStorage.removeItem('admin_role')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      sessionStorage.setItem('admin_active', 'true')
      sessionStorage.setItem('admin_role', data.role || 'admin')
      toast.success('Admin Authenticated')
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="login-bg centered-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="premium-card" 
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '50%' }}>
              <ShieldCheck size={32} color="#ffffff" />
            </div>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>
            Admin Portal
          </h1>
          <p style={{ color: '#64748b' }}>Sign in to manage streams</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '500' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                color: '#0f172a', outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0f172a')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '500' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                color: '#0f172a', outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0f172a')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading} 
            style={{ 
              marginTop: '1rem',
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem', 
              background: '#0f172a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
