const NOTIFICATIONS_KEY = 'ef_demo_notifications'
const NOTIFICATIONS_EVENT = 'ef:notifications-updated'
const MAX_NOTIFICATIONS = 100

export type NotificationKind = 'lead' | 'booking' | 'follow-up'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  description: string
  actor: string
  createdAt: string
  href: string
  read: boolean
}

function readNotifications(): AppNotification[] {
  const serialized = localStorage.getItem(NOTIFICATIONS_KEY)
  if (!serialized) return []

  const parsed: unknown = JSON.parse(serialized)
  if (!Array.isArray(parsed)) {
    throw new Error('Saved notifications are not a list')
  }
  return parsed as AppNotification[]
}

function saveNotifications(notifications: AppNotification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)))
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
}

function getCreatorName(): string {
  const serializedUser = localStorage.getItem('ef_user')
  if (!serializedUser) return 'Unknown user'
  const user: unknown = JSON.parse(serializedUser)
  if (typeof user !== 'object' || user === null || !('name' in user) || typeof user.name !== 'string') {
    return 'Unknown user'
  }
  return user.name.trim() || 'Unknown user'
}

export const notificationsService = {
  getNotifications: () => readNotifications(),

  create: (notification: Omit<AppNotification, 'id' | 'actor' | 'createdAt' | 'read'>) => {
    const created: AppNotification = {
      ...notification,
      id: `notification-${crypto.randomUUID()}`,
      actor: getCreatorName(),
      createdAt: new Date().toISOString(),
      read: false,
    }
    saveNotifications([created, ...readNotifications()])
    return created
  },

  markRead: (id: string) => {
    const notifications = readNotifications()
    const updated = notifications.map((item) => item.id === id ? { ...item, read: true } : item)
    saveNotifications(updated)
  },

  markAllRead: () => {
    const notifications = readNotifications()
    saveNotifications(notifications.map((item) => ({ ...item, read: true })))
  },

  subscribe: (listener: () => void) => {
    window.addEventListener(NOTIFICATIONS_EVENT, listener)
    window.addEventListener('storage', listener)
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, listener)
      window.removeEventListener('storage', listener)
    }
  },
}
