import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Building2, BookOpen, PhoneCall,
  UserCheck, BarChart3, Settings, Bell, Plus, LogOut, CheckCheck,
  Search, Menu, ChevronDown, Moon, Sun
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getInitials } from '../../utils/formatters'
import { GlobalSearch } from '../ui/GlobalSearch'
import { NewActionMenu } from '../ui/NewActionMenu'
import { useQuery } from '@tanstack/react-query'
import { leadsService } from '../../services/leads'
import { followUpsService } from '../../services/followUps'
import { useTheme } from '../../hooks/useTheme'
import { notificationsService } from '../../services/notifications'
import type { AppNotification } from '../../services/notifications'

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads',      icon: Users,           label: 'Leads' },
  { to: '/properties', icon: Building2,       label: 'Properties' },
  { to: '/bookings',   icon: BookOpen,        label: 'Bookings' },
  { to: '/follow-ups', icon: PhoneCall,       label: 'Follow-ups' },
  { to: '/sales-team', icon: UserCheck,       label: 'Sales Team', adminOnly: true },
  { to: '/reports',    icon: BarChart3,       label: 'Reports' },
  { to: '/settings',   icon: Settings,        label: 'Settings' },
]

export function MainLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const [searchOpen, setSearchOpen]   = useState(false)
  const [actionOpen, setActionOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => notificationsService.getNotifications())
  const { darkMode, setDarkMode } = useTheme()
  const mainRef = useRef<HTMLElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const notificationsMenuRef = useRef<HTMLDivElement>(null)
  const { data: leadCount } = useQuery({
    queryKey: ['leads', 'nav-count'],
    queryFn: () => leadsService.getLeads({ limit: 1 }),
  })
  const { data: followUps } = useQuery({
    queryKey: ['follow-ups', 'nav-pending'],
    queryFn: () => followUpsService.getFollowUps({ status: 'PENDING', limit: 1 }),
  })
  const hasPendingFollowUps = (followUps?.total ?? 0) > 0
  const unreadNotifications = notifications.filter((notification) => !notification.read).length

  useEffect(() => notificationsService.subscribe(() => {
    setNotifications(notificationsService.getNotifications())
  }), [])

  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 1024px)')
    const syncSidebarToViewport = (event: MediaQueryListEvent) => setSidebarOpen(event.matches)
    breakpoint.addEventListener('change', syncSidebarToViewport)
    return () => breakpoint.removeEventListener('change', syncSidebarToViewport)
  }, [])

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
    setActionOpen(false)
    setProfileOpen(false)
    setNotificationsOpen(false)
    if (window.matchMedia('(max-width: 1023px)').matches) setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!profileOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [profileOpen])

  useEffect(() => {
    if (!notificationsOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!notificationsMenuRef.current?.contains(event.target as Node)) setNotificationsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [notificationsOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fd] text-[#17212b]">
      {/* ── Sidebar ─────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-10 bg-gray-900/30 lg:hidden"
            />
            <motion.aside
              key="sidebar"
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 left-0 z-20 flex w-56 flex-shrink-0 flex-col border-r border-[#e7ebf3] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)] lg:relative lg:inset-auto"
            >
            {/* Logo */}
            <div className="mx-3 flex h-16 flex-shrink-0 items-center gap-2.5 border-b border-[#e7ebf3] px-1 py-0 sm:h-[82px]">
              <img src="/manju-groups-logo.png" alt="" className="h-9 w-12 flex-shrink-0 rounded bg-white object-cover" />
              <div className="leading-none">
                <div className="text-[13px] font-black tracking-wide text-[#55585b]">MANJU</div>
                <div className="mt-1 text-[9px] font-bold tracking-[0.3em] text-[#55585b]">GROUPS</div>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3 scrollbar-thin">
              {NAV.filter(({ adminOnly }) => !adminOnly || user?.role === 'ADMIN').map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => {
                    if (window.matchMedia('(max-width: 1023px)').matches) setSidebarOpen(false)
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[12px] font-medium transition-all ${
                      isActive
                        ? 'bg-[#01a0e2] text-white shadow-sm'
                        : 'text-[#52616d] hover:bg-[#eaf5e5] hover:text-[#4f8f27]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {label === 'Leads' && (
                    <span className={`min-w-[23px] rounded px-1.5 py-0.5 text-center text-[10px] font-semibold ${location.pathname.startsWith('/leads') ? 'bg-white/20 text-white' : 'bg-[#e5eafe] text-[#52608a]'}`}>
                      {leadCount?.total ?? 0}
                    </span>
                  )}
                  {label === 'Follow-ups' && hasPendingFollowUps && (
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#ef8a35]" />
                  )}
                </NavLink>
              ))}
            </nav>

            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="z-10 flex h-16 flex-shrink-0 items-center gap-2 border-b border-[#e7ebf3] bg-white px-3 sm:gap-4 sm:px-6 sm:h-[82px]">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-8 min-w-0 w-full max-w-[600px] flex-1 items-center gap-2 rounded-xl bg-[#eff3ff] px-3 text-left text-sm text-[#8290a1] transition-colors hover:bg-[#eaf5e5] sm:h-10 sm:px-4"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 truncate">Search leads, units, bookings…</span>
            <span className="hidden rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400 md:block">⌘K</span>
          </button>

          <div className="ml-auto flex flex-shrink-0 items-center gap-1 sm:gap-3">
            {/* New Action */}
            <div className="relative">
              <button
                onClick={() => setActionOpen(v => !v)}
                aria-label="New Action"
                aria-expanded={actionOpen}
                className="flex h-8 w-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#01a0e2] px-0 text-sm font-medium text-white transition-colors hover:bg-[#eaf5e5] hover:text-[#365f22] sm:h-10 sm:w-auto sm:justify-start sm:gap-2 sm:px-4"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:block">New Action</span>
                <ChevronDown className="hidden w-3 h-3 sm:block" />
              </button>
              <AnimatePresence>
                {actionOpen && <NewActionMenu onClose={() => setActionOpen(false)} />}
              </AnimatePresence>
            </div>

            <button
              type="button"
              aria-label={darkMode ? 'Switch to light theme' : 'Switch to night theme'}
              title={darkMode ? 'Switch to light theme' : 'Switch to night theme'}
              onClick={() => setDarkMode((current) => !current)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 sm:h-11 sm:w-11"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications */}
            <div ref={notificationsMenuRef} className="relative">
              <button
                type="button"
                aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
                aria-haspopup="dialog"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((current) => !current)}
                className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 sm:h-11 sm:w-11"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-400 ring-2 ring-white" />
                )}
              </button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    role="dialog"
                    aria-label="Notifications"
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 top-[calc(100%+10px)] z-40 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {unreadNotifications ? `${unreadNotifications} unread` : 'You’re all caught up'}
                        </p>
                      </div>
                      {unreadNotifications > 0 && (
                        <button
                          type="button"
                          onClick={() => notificationsService.markAllRead()}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-sky-700 hover:bg-[#eaf5e5] hover:text-[#4f8f27]"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[min(24rem,65vh)] overflow-y-auto">
                      {notifications.length ? notifications.slice(0, 50).map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            notificationsService.markRead(notification.id)
                            setNotificationsOpen(false)
                            navigate(notification.href)
                          }}
                          className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                            notification.read ? '' : 'bg-sky-50/60'
                          }`}
                        >
                          <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${notification.read ? 'bg-gray-200' : 'bg-orange-400'}`} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-gray-900">{notification.title}</span>
                            <span className="mt-1 block truncate text-xs text-gray-600">{notification.description}</span>
                            <span className="mt-1.5 block text-[10px] text-gray-500">
                              {notification.actor} · {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notification.createdAt))}
                            </span>
                          </span>
                        </button>
                      )) : (
                        <div className="px-4 py-8 text-center">
                          <Bell className="mx-auto h-5 w-5 text-gray-300" />
                          <p className="mt-2 text-xs font-medium text-gray-600">No notifications yet</p>
                          <p className="mt-1 text-[11px] text-gray-500">New leads, bookings, and follow-ups will appear here.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                aria-label="Open account menu"
                aria-haspopup="dialog"
                aria-expanded={profileOpen}
                title="Account"
                className="flex flex-shrink-0 items-center gap-2 rounded-xl p-1 transition-colors hover:bg-gray-100"
              >
                <span className="hidden text-right sm:block">
                  <span className="block text-xs font-semibold leading-none text-gray-900">{user?.name}</span>
                  <span className="mt-0.5 block text-[10px] text-gray-500">{user?.designation ?? user?.role}</span>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#01a0e2] text-xs font-bold text-white">
                  {getInitials(user?.name ?? '?')}
                </span>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    role="dialog"
                    aria-label="Account details"
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 top-[calc(100%+10px)] z-40 w-[min(17rem,calc(100vw-1.5rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
                  >
                    <p className="break-all text-sm font-medium text-gray-900">{user?.email}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Role: {user?.role === 'ADMIN' ? 'Administrator' : 'Sales employee'}
                    </p>
                    <div className="my-3 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        logout()
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page */}
        <main ref={mainRef} className="relative flex-1 overflow-auto bg-[#f7f8fd]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
          <div
            aria-hidden="true"
            className={`pointer-events-none fixed inset-x-0 bottom-0 top-16 z-20 flex items-center justify-center overflow-hidden opacity-[0.08] dark:opacity-[0.07] sm:top-[82px] ${
              sidebarOpen ? 'lg:left-56' : 'lg:left-0'
            }`}
          >
            <img
              src="/manju-groups-mark.svg"
              alt=""
              className="w-[min(76vw,680px)] object-contain"
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
