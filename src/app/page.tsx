'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserLogin() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (code.length !== 8) {
      toast.error('ITS Number must be exactly 8 digits')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate')
      }

      toast.success('Access Granted')
      router.push('/user/live')
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
        style={{ width: '100%', maxWidth: '450px', textAlign: 'center' }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '50%' }}>
              <KeyRound size={32} color="#ffffff" />
            </div>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>
            Badri Relay
          </h1>
          <p style={{ color: '#64748b' }}>Enter your 8-digit ITS Number</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                if (val.length <= 8) setCode(val)
              }}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                textAlign: 'center',
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                outline: 'none',
                transition: 'all 0.2s',
                fontWeight: '600'
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
              width: '100%', 
              padding: '1rem', 
              fontSize: '1.1rem', 
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
            {loading ? 'Verifying...' : 'Access Stream'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
