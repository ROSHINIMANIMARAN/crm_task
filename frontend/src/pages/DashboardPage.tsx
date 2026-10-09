import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowRight, BellRing, Building2, CalendarClock, CheckCircle2,
  CircleDollarSign, Map, Plus, Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { bookingsService } from '../services/bookings'
import { followUpsService } from '../services/followUps'
import { leadsService } from '../services/leads'
import { projectsService } from '../services/projects'
import { formatCurrency, PROPERTY_TYPE_LABELS, STAGE_LABELS } from '../utils/formatters'
import type { LeadStage } from '../types'

const stages: LeadStage[] = ['NEW', 'CONTACTED', 'SITE_VISIT', 'INTERESTED', 'NEGOTIATION', 'BOOKED', 'LOST']

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#edf0f6] bg-white shadow-[0_2px_8px_rgba(22,34,51,0.025)] dark:border-[#2d3b49] dark:bg-[#18232f] ${className}`}>{children}</section>
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isSales = user?.role === 'SALES_EMPLOYEE'
  const leadQuery = useQuery({
    queryKey: ['leads', 'dashboard', user?.id, user?.role],
    queryFn: () => leadsService.getLeads({ assignedTo: isSales ? user?.id : undefined, limit: 500 }),
  })
  const followUpQuery = useQuery({
    queryKey: ['follow-ups', 'dashboard', user?.id, user?.role],
    queryFn: () => followUpsService.getFollowUps({ assignedTo: isSales ? user?.id : undefined, status: 'PENDING', limit: 5 }),
  })
  const projectQuery = useQuery({ queryKey: ['projects'], queryFn: projectsService.getProjects })
  const bookingQuery = useQuery({
    queryKey: ['bookings', 'dashboard', user?.id, user?.role],
    queryFn: () => bookingsService.getBookings({ assignedTo: isSales ? user?.id : undefined, limit: 500 }),
  })

  const name = user?.name ?? 'Roshini'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const leadList = leadQuery.data?.leads ?? []
  const pendingFollowUps = followUpQuery.data?.followUps ?? []
  const projects = projectQuery.data ?? []
  const bookings = (bookingQuery.data?.bookings ?? []).filter((booking) => !isSales || booking.salesEmployeeId === user?.id)
  const unitList = projects.flatMap((project) => project.buildings ?? []).flatMap((building) => building.units ?? [])
  const availableUnits = unitList.filter((unit) => unit.status === 'AVAILABLE').length
  const metricCards = [
    { label: 'TOTAL LEADS', value: leadQuery.data?.total ?? 0, note: isSales ? 'Assigned to you' : 'Saved lead records', icon: Users },
    { label: 'NEW LEADS', value: leadList.filter((lead) => lead.stage === 'NEW').length, note: 'Current stage: new', icon: Plus },
    { label: 'SITE VISITS', value: leadList.filter((lead) => lead.stage === 'SITE_VISIT').length, note: 'Current stage: site visit', icon: Map },
    { label: 'IN NEGOTIATION', value: leadList.filter((lead) => lead.stage === 'NEGOTIATION').length, note: 'Current stage: negotiation', icon: CircleDollarSign },
    { label: 'BOOKED LEADS', value: leadList.filter((lead) => lead.stage === 'BOOKED').length, note: 'Lead stage: booked', icon: CheckCircle2 },
    { label: 'PENDING FOLLOW-UPS', value: followUpQuery.data?.total ?? 0, note: 'Saved pending actions', icon: BellRing },
    { label: 'SAVED PROJECTS', value: projects.length, note: 'Property records', icon: Building2 },
    { label: 'AVAILABLE UNITS', value: availableUnits, note: 'Saved inventory records', icon: CalendarClock },
  ]
  const pipeline = stages.map((stage) => {
    const count = leadList.filter((lead) => lead.stage === stage).length
    return { stage, count, width: leadList.length ? count / leadList.length * 100 : 0 }
  })
  const loading = leadQuery.isLoading || followUpQuery.isLoading || projectQuery.isLoading || bookingQuery.isLoading
  const failed = leadQuery.isError || followUpQuery.isError || projectQuery.isError || bookingQuery.isError

  if (loading) return <div className="p-6 text-sm text-gray-500 dark:text-[#cbd5df]">Loading your saved CRM records…</div>
  if (failed) return <div role="alert" className="m-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">Dashboard data could not be loaded. Refresh and try again.</div>

  return (
    <div className="space-y-4 p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#9a6b3e] dark:text-[#d5ad82]">{new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-[#151c25] dark:text-[#e5eaf0]">{greeting}, {name}</h1>
          
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/follow-ups?new=true')} className="flex items-center gap-1.5 rounded-md border border-[#e6eaf1] bg-white px-3 py-2 text-xs font-semibold text-[#485667] hover:bg-[#f6f8fc] dark:border-[#3b4a59] dark:bg-[#202b36] dark:text-[#d4dde6] dark:hover:bg-[#293745]"><CalendarClock className="h-3.5 w-3.5" /> Schedule follow-up</button>
          <button onClick={() => navigate('/leads?new=true')} className="flex items-center gap-1.5 rounded-md bg-[#01a0e2] px-3 py-2 text-xs font-semibold text-white hover:bg-[#eaf5e5] hover:text-[#365f22]"><Plus className="h-3.5 w-3.5" /> New Lead</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {metricCards.map(({ label, value, note, icon: Icon }, index) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} className="group relative min-h-[82px] rounded-lg border border-[#edf0f6] bg-white p-2.5 shadow-[0_2px_8px_rgba(22,34,51,0.025)] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:z-10 hover:scale-[1.04] hover:border-[#55a630] hover:shadow-[0_8px_20px_rgba(85,166,48,0.22)] dark:border-[#2d3b49] dark:bg-[#18232f] dark:hover:border-[#72bb4b] dark:hover:shadow-[0_8px_22px_rgba(85,166,48,0.2)]">
            <div className="flex items-center justify-between gap-1 text-[8px] font-semibold tracking-wide text-[#758193] dark:text-[#aab7c4]"><span>{label}</span><Icon className="h-3 w-3 shrink-0 text-[#698092] transition-colors duration-200 group-hover:text-[#55a630] dark:text-[#91a5b5] dark:group-hover:text-[#72bb4b]" /></div>
            <div className="mt-2 text-[19px] font-semibold leading-none text-[#1c2935] dark:text-[#e5eaf0]">{value}</div>
            <div className="mt-1.5 truncate text-[8px] font-medium text-[#01a0e2] transition-colors duration-200 group-hover:text-[#55a630] dark:group-hover:text-[#72bb4b]">{note}</div>
          </motion.div>
        ))}
      </div>

      <Panel className="p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><h2 className="text-sm font-semibold text-[#202b37] dark:text-[#e5eaf0]">Lead pipeline</h2><p className="mt-1 text-xs text-[#8792a0] dark:text-[#aab7c4]">Current lead distribution by stage</p></div>
          <span className="rounded-md bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-[#01a0e2] dark:bg-[#12384b] dark:text-[#70cafa]">{leadQuery.data?.total ?? 0} leads</span>
        </div>
        {leadList.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{pipeline.map(({ stage, count, width }, index) => <motion.div key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.25 }} className="progress-hover-trigger group rounded-lg bg-[#f5f7fe] p-3 transition-[transform,box-shadow] duration-200 ease-out hover:z-10 hover:scale-[1.03] hover:shadow-[0_6px_16px_rgba(107,114,128,0.25)] dark:bg-[#202b36] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.35)]"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#394655] dark:text-[#cbd5df]">{STAGE_LABELS[stage]}</span><span className="text-xs font-bold tabular-nums text-[#344252] dark:text-[#e5eaf0]">{count}</span></div><div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-[#e3e8f1] dark:bg-[#334252]"><div className="h-full rounded-full bg-[#01a0e2]" style={{ width: `${width}%` }} /><div aria-hidden="true" className="progress-hover-fill pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[#55a630] dark:bg-[#72bb4b]" style={{ width: `${width}%` }} /></div></motion.div>)}</div> : <EmptyState icon={Users} title="No lead records yet" description="Add a lead to see its current stage in the pipeline." action={{ label: 'Add lead', onClick: () => navigate('/leads?new=true') }} />}
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel className="overflow-hidden transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(85,166,48,0.22)] dark:hover:shadow-[0_8px_24px_rgba(85,166,48,0.18)]">
          <div className="flex items-center justify-between border-b border-[#edf0f6] px-4 py-3 dark:border-[#2d3b49]"><div><h2 className="text-sm font-semibold text-[#202b37] dark:text-[#e5eaf0]">Pending follow-ups</h2><p className="mt-1 text-xs text-[#8792a0] dark:text-[#aab7c4]">Saved scheduled actions</p></div><button onClick={() => navigate('/follow-ups')} className="flex items-center gap-1 text-xs font-semibold text-[#01a0e2]">View all <ArrowRight className="h-3 w-3" /></button></div>
          {pendingFollowUps.length ? <div className="divide-y divide-[#f0f2f7] dark:divide-[#2d3b49]">{pendingFollowUps.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"><div><p className="text-xs font-semibold text-gray-800 dark:text-[#e5eaf0]">{item.lead?.name ?? 'Lead'}</p><p className="mt-1 text-[11px] text-gray-500 dark:text-[#aab7c4]">{item.type.replace('_', ' ')} · {item.notes || 'No notes'}</p></div><div className="text-right"><p className="text-[11px] font-medium text-gray-700 dark:text-[#cbd5df]">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.followUpDate))}</p><p className="mt-1 text-[10px] text-gray-500 dark:text-[#aab7c4]">{item.priority}</p></div></div>)}</div> : <EmptyState icon={CalendarClock} title="No pending follow-ups" description="Schedule an action and it will appear here." action={{ label: 'Schedule follow-up', onClick: () => navigate('/follow-ups?new=true') }} />}
        </Panel>

        <Panel className="overflow-hidden transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(85,166,48,0.22)] dark:hover:shadow-[0_8px_24px_rgba(85,166,48,0.18)]">
          <div className="flex items-center justify-between border-b border-[#edf0f6] px-4 py-3 dark:border-[#2d3b49]"><div><h2 className="text-sm font-semibold text-[#202b37] dark:text-[#e5eaf0]">Recent bookings</h2><p className="mt-1 text-xs text-[#8792a0] dark:text-[#aab7c4]">Saved booking records</p></div><button onClick={() => navigate('/bookings')} className="flex items-center gap-1 text-xs font-semibold text-[#01a0e2]">View all <ArrowRight className="h-3 w-3" /></button></div>
          {bookings.length ? <div className="divide-y divide-[#f0f2f7] dark:divide-[#2d3b49]">{bookings.slice(0, 5).map((booking) => <div key={booking.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"><div><p className="text-xs font-semibold text-gray-800 dark:text-[#e5eaf0]">{booking.lead?.name ?? 'Customer'} · {booking.bookingNumber}</p><p className="mt-1 text-[11px] text-gray-500 dark:text-[#aab7c4]">{booking.project?.name} · {booking.unit?.unitNumber} · {booking.unit?.type ? PROPERTY_TYPE_LABELS[booking.unit.type] : ''}</p></div><div className="text-right"><p className="text-xs font-semibold text-gray-800 dark:text-[#e5eaf0]">{formatCurrency(booking.totalPrice)}</p><p className="mt-1 text-[10px] text-gray-500 dark:text-[#aab7c4]">{booking.status}</p></div></div>)}</div> : <EmptyState icon={CheckCircle2} title="No booking records yet" description="Completed booking activity will appear here." action={{ label: 'View bookings', onClick: () => navigate('/bookings') }} />}
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="border-b border-[#edf0f6] px-4 py-3 dark:border-[#2d3b49]"><h2 className="text-sm font-semibold text-[#202b37] dark:text-[#e5eaf0]">Property inventory</h2><p className="mt-1 text-xs text-[#8792a0] dark:text-[#aab7c4]">Availability from saved projects, buildings, and units only.</p></div>
        {projects.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-[#f4f6fd] text-[10px] uppercase tracking-wide text-[#8490a0] dark:bg-[#202b36] dark:text-[#aab7c4]"><tr>{['Project', 'Location', 'Buildings', 'Units', 'Available'].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[#f0f2f7] dark:divide-[#2d3b49]">{projects.map((project) => <tr key={project.id}><td className="px-4 py-3 font-medium text-gray-800 dark:text-[#e5eaf0]">{project.name}</td><td className="px-4 py-3 text-gray-600 dark:text-[#cbd5df]">{project.location}</td><td className="px-4 py-3 text-gray-600 dark:text-[#cbd5df]">{project.buildings?.length ?? 0}</td><td className="px-4 py-3 text-gray-600 dark:text-[#cbd5df]">{project.totalUnits ?? 0}</td><td className="px-4 py-3 font-semibold text-sky-800 dark:text-[#70cafa]">{project.availableUnits ?? 0}</td></tr>)}</tbody></table></div> : <EmptyState icon={Building2} title="No property records yet" description="Saved projects and unit availability will be summarized here." action={user?.role === 'ADMIN' ? { label: 'Add project', onClick: () => navigate('/properties') } : undefined} />}
      </Panel>
    </div>
  )
}
