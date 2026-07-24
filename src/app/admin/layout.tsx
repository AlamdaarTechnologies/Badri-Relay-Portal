'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, KeyRound, Radio, LogOut, Menu, X, ShieldCheck, Users } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [adminRole, setAdminRole] = useState<string>('admin')

  useEffect(() => {
    setMounted(true)
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (pathname !== '/admin/login') {
      const isActive = sessionStorage.getItem('admin_active')
      if (!isActive) {
        handleLogout()
      }
      const role = sessionStorage.getItem('admin_role')
      if (role) setAdminRole(role)
    }
  }, [pathname])

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoggingOut(false)
    }
  }, [pathname])

  // Admin heartbeat & beforeunload
  useEffect(() => {
    if (pathname === '/admin/login') return

    let interval: NodeJS.Timeout

    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/auth/admin/heartbeat', { method: 'POST' })
        if (res.status === 401 || res.status === 403) {
          clearInterval(interval)
          sessionStorage.removeItem('admin_active')
          sessionStorage.removeItem('admin_role')
          router.push('/admin/login')
        }
      } catch (err) {
        console.error('Admin heartbeat failed', err)
      }
    }

    sendHeartbeat()
    interval = setInterval(sendHeartbeat, 1000)

    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/auth/admin/leave')
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname, router])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/admin/leave', { method: 'POST' })
    await fetch('/api/auth/admin/logout', { method: 'POST' })
    sessionStorage.removeItem('admin_active')
    sessionStorage.removeItem('admin_role')
    router.push('/admin/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'ITS Numbers', path: '/admin/codes', icon: <KeyRound size={20} /> },
    { name: 'Streams', path: '/admin/streams', icon: <Radio size={20} /> },
    ...(adminRole === 'master' ? [{ name: 'Admin Accounts', path: '/admin/accounts', icon: <Users size={20} /> }] : []),
  ]

  const renderSidebarContent = () => (
    <>
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: isSidebarOpen ? 'space-between' : 'center', alignItems: 'center', height: '32px' }}>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: mounted ? 0 : 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <ShieldCheck size={28} className="text-gradient" color="#3b82f6" style={{ minWidth: '28px' }} />
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.025em', margin: 0, color: 'white' }}>
              Badri Relay
            </h2>
          </motion.div>
        )}
        <button 
          style={{ padding: 0, background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? (isMobile ? <X size={24} /> : <Menu size={24} />) : <Menu size={24} />}
        </button>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={() => {
                if (isMobile) setIsSidebarOpen(false)
              }}
            >
              <motion.div
                whileHover={{ x: 4 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: isActive ? '#3b82f6' : '#94a3b8',
                  fontWeight: isActive ? 600 : 500,
                  border: '1px solid',
                  borderColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  transition: 'background 0.2s, color 0.2s',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center'
                }}
              >
                <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.name}</span>}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <motion.button 
        whileHover={{ x: isSidebarOpen ? 4 : 0, color: '#ef4444' }}
        onClick={handleLogout}
        disabled={loggingOut}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem',
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          borderRadius: '8px',
          cursor: 'pointer',
          textAlign: 'left',
          marginTop: 'auto',
          transition: 'color 0.2s',
          fontWeight: 500,
          justifyContent: isSidebarOpen ? 'flex-start' : 'center'
        }}
      >
        <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}><LogOut size={20} /></div>
        {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{loggingOut ? 'Logging out...' : 'Log Out'}</span>}
      </motion.button>
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: '#0f172a' }}>
      
      {/* Mobile Header */}
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', borderBottom: '1px solid #334155', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={24} color="#3b82f6" />
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.025em', margin: 0, color: 'white' }}>
              Badri Relay
            </h2>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            <Menu size={28} />
          </button>
        </div>
      )}

      {/* Sidebar - Mobile Overlay */}
      {isMobile && (
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
                  zIndex: 90
                }}
                onClick={() => setIsSidebarOpen(false)}
              />
              <motion.aside 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                  position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px',
                  background: '#1e293b', borderRight: '1px solid #334155',
                  padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column',
                  zIndex: 100
                }}
              >
                {renderSidebarContent()}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Sidebar - Desktop Collapsible */}
      {!isMobile && (
        <motion.aside 
          initial={{ width: isSidebarOpen ? 260 : 80 }}
          animate={{ width: isSidebarOpen ? 260 : 80 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            background: '#1e293b', 
            borderRight: '1px solid #334155',
            padding: '2rem 1rem', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'sticky',
            top: 0,
            height: '100vh'
          }}
        >
          {renderSidebarContent()}
        </motion.aside>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
