import { LeadStage, Priority, UnitStatus, ProjectStatus, LeadSource, PropertyType, FollowUpType } from '../types'

export function formatCurrency(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`
  if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(2)} Lakhs`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function formatTime(dateString: string): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function isOverdue(dateString: string): boolean {
  return new Date(dateString) < new Date(new Date().setHours(0, 0, 0, 0))
}

export function isToday(dateString: string): boolean {
  const d = new Date(dateString)
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

// ─── Labels ──────────────────────────────────────────────────────────────────

export const STAGE_LABELS: Record<LeadStage, string> = {
  NEW:         'New Intake',
  CONTACTED:   'Contacted',
  SITE_VISIT:  'Site Visit',
  INTERESTED:  'Interested',
  NEGOTIATION: 'Negotiation',
  BOOKED:      'Booked',
  LOST:        'Lost',
}

export const SOURCE_LABELS: Record<LeadSource, string> = {
  PORTAL:           'Portal / Ads',
  REFERRAL:         'Referral',
  CHANNEL_PARTNER:  'Channel Partner (CP)',
  DIRECT:           'Direct',
  SITE_WALK_IN:     'Site Walk-in',
  DIGITAL_CAMPAIGN: 'Digital Campaign',
  NRI_REFERRAL:     'NRI Referral',
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  TWO_BHK:        '2 BHK',
  THREE_BHK:      '3 BHK',
  THREE_BHK_LUXURY: '3 BHK Luxury',
  FOUR_BHK:       '4 BHK',
  PENTHOUSE:      'Penthouse',
  VILLA:          'Villa',
  PLOT:           'Plot',
}

export const FOLLOWUP_TYPE_LABELS: Record<FollowUpType, string> = {
  CALL:        'Phone Call',
  SITE_VISIT:  'Site Visit',
  WHATSAPP:    'WhatsApp',
  EMAIL:       'Email',
  NEGOTIATION: 'Negotiation',
  MEETING:     'Meeting',
}

// ─── Colors ──────────────────────────────────────────────────────────────────

export const STAGE_COLORS: Record<LeadStage, string> = {
  NEW:         'bg-sky-100 text-sky-700 border border-sky-200',
  CONTACTED:   'bg-cyan-100 text-cyan-700 border border-cyan-200',
  SITE_VISIT:  'bg-purple-100 text-purple-700 border border-purple-200',
  INTERESTED:  'bg-indigo-100 text-indigo-700 border border-indigo-200',
  NEGOTIATION: 'bg-orange-100 text-orange-700 border border-orange-200',
  BOOKED:      'bg-sky-100 text-sky-700 border border-sky-200',
  LOST:        'bg-red-100 text-red-700 border border-red-200',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW:    'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH:   'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

export const UNIT_STATUS_COLORS: Record<UnitStatus, string> = {
  AVAILABLE: 'bg-sky-100 text-sky-700',
  RESERVED:  'bg-orange-100 text-orange-700',
  BOOKED:    'bg-sky-100 text-sky-700',
  BLOCKED:   'bg-red-100 text-red-700',
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  ACTIVE:   'bg-sky-100 text-sky-700',
  READY:    'bg-sky-100 text-sky-700',
  UPCOMING: 'bg-yellow-100 text-yellow-700',
}
