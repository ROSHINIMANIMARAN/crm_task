import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, BarChart3, CalendarClock, CheckCircle2, Users } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { bookingsService } from '../services/bookings'
import { followUpsService } from '../services/followUps'
import { leadsService } from '../services/leads'
import { STAGE_LABELS } from '../utils/formatters'
import type { LeadStage } from '../types'

const stages: LeadStage[] = ['NEW', 'CONTACTED', 'SITE_VISIT', 'INTERESTED', 'NEGOTIATION', 'BOOKED', 'LOST']

export function ReportsPage() {
  const { user } = useAuth()
  const isSales = user?.role === 'SALES_EMPLOYEE'
  const leadsQuery = useQuery({
    queryKey: ['leads', 'reports', user?.id, user?.role],
    queryFn: () => leadsService.getLeads({ assignedTo: isSales ? user?.id : undefined, limit: 500 }),
  })
  const followUpsQuery = useQuery({
    queryKey: ['follow-ups', 'reports', user?.id, user?.role],
    queryFn: () => followUpsService.getFollowUps({ assignedTo: isSales ? user?.id : undefined, limit: 500 }),
  })
  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'reports', user?.id, user?.role],
    queryFn: () => bookingsService.getBookings({ assignedTo: isSales ? user?.id : undefined, limit: 500 }),
  })
  const loading = leadsQuery.isLoading || followUpsQuery.isLoading || bookingsQuery.isLoading
  const failed = leadsQuery.isError || followUpsQuery.isError || bookingsQuery.isError
  const leads = leadsQuery.data?.leads ?? []
  const followUps = followUpsQuery.data?.followUps ?? []
  const bookings = bookingsQuery.data?.bookings ?? []
  const pendingFollowUps = followUps.filter((item) => item.status === 'PENDING').length
  const closedLeads = leads.filter((lead) => lead.stage === 'BOOKED' || lead.stage === 'LOST').length
  const conversion = leads.length ? Math.round((leads.filter((lead) => lead.stage === 'BOOKED').length / leads.length) * 100) : 0

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading saved report data…</div>
  if (failed) return <div role="alert" className="m-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">One or more report datasets could not be loaded. Refresh and try again.</div>

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-50 p-3 text-sky-800"><BarChart3 className="h-5 w-5" /></div>
            <div><h1 className="text-lg font-bold text-gray-900">Reports</h1><p className="mt-1 text-xs text-gray-500">{isSales ? 'Your assigned lead and follow-up records' : 'Current saved team records'} · live browser data</p></div>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total leads', value: leads.length, icon: Users },
            { label: 'Open leads', value: leads.filter((lead) => !['BOOKED', 'LOST'].includes(lead.stage)).length, icon: ArrowUpRight },
            { label: 'Pending follow-ups', value: pendingFollowUps, icon: CalendarClock },
            { label: 'Bookings', value: bookings.length, icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-xs text-gray-500"><span>{label}</span><Icon className="h-4 w-4 text-sky-800" /></div><p className="mt-3 text-2xl font-bold text-gray-900">{value}</p></article>)}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between"><div><h2 className="text-sm font-bold text-gray-900">Lead stages</h2><p className="mt-1 text-xs text-gray-500">Counts calculated from saved lead records.</p></div><span className="rounded-full bg-gray-50 px-2.5 py-1 text-[10px] text-gray-500">{leads.length} total</span></div>
            {leads.length ? <div className="space-y-4">{stages.map((stage) => {
              const count = leads.filter((lead) => lead.stage === stage).length
              const width = leads.length ? count / leads.length * 100 : 0
              return <div key={stage} className="progress-hover-trigger"><div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-medium text-gray-700">{STAGE_LABELS[stage]}</span><span className="tabular-nums text-gray-500">{count} · {Math.round(width)}%</span></div><div className="relative h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-sky-700" style={{ width: `${width}%` }} /><div aria-hidden="true" className="progress-hover-fill pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[#55a630]" style={{ width: `${width}%` }} /></div></div>
            })}</div> : <EmptyState icon={Users} title="No lead records yet" description="Stage metrics will appear when leads are added." />}
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900">Current conversion</h2>
            <p className="mt-1 text-xs text-gray-500">Booked leads divided by all saved leads.</p>
            {leads.length ? <><p className="mt-6 text-4xl font-bold text-gray-900">{conversion}%</p><p className="mt-2 text-xs text-gray-500">{leads.filter((lead) => lead.stage === 'BOOKED').length} booked · {closedLeads} closed (booked or lost)</p></> : <p className="mt-6 text-sm text-gray-500">No lead records to calculate conversion yet.</p>}
            <div className="mt-6 border-t border-gray-100 pt-4"><h3 className="text-xs font-semibold text-gray-800">Data scope</h3><p className="mt-1 text-xs leading-5 text-gray-500">{isSales ? 'Only records assigned to your sales account are included.' : 'All records stored in this browser are included.'} No sample or forecast metrics are mixed in.</p></div>
          </section>
        </div>
      </div>
    </div>
  )
}
