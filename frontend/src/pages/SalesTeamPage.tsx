import { useQuery } from '@tanstack/react-query'
import { BriefcaseBusiness, ShieldCheck, Users } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { getDemoUsers } from '../services/demoStore'
import { leadsService } from '../services/leads'

export function SalesTeamPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const usersQuery = useQuery({ queryKey: ['sales-team'], queryFn: getDemoUsers })
  const leadsQuery = useQuery({
    queryKey: ['leads', 'sales-team'],
    queryFn: () => leadsService.getLeads({ assignedTo: isAdmin ? undefined : user?.id, limit: 500 }),
  })
  const users = (usersQuery.data ?? []).filter((member) => isAdmin ? true : member.id === user?.id)
  const leadRecords = leadsQuery.data?.leads ?? []

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-50 p-3 text-sky-800"><Users className="h-5 w-5" /></div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{isAdmin ? 'Sales team' : 'My sales profile'}</h1>
              <p className="mt-1 text-xs text-gray-500">{isAdmin ? 'Accounts available in this browser. Team metrics use saved lead records only.' : 'Your profile and lead assignments in this browser.'}</p>
            </div>
          </div>
        </header>

        {usersQuery.isLoading || leadsQuery.isLoading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">Loading current team records…</div>
        ) : usersQuery.isError || leadsQuery.isError ? (
          <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">Team records could not be loaded. Refresh and try again.</div>
        ) : users.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {users.map((member) => {
              const assignedLeads = leadRecords.filter((lead) => lead.assignedToId === member.id)
              const activeLeads = assignedLeads.filter((lead) => !['BOOKED', 'LOST'].includes(lead.stage))
              const bookedLeads = assignedLeads.filter((lead) => lead.stage === 'BOOKED')
              return (
                <article key={member.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-900">{member.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                      <div className="min-w-0"><h2 className="truncate text-sm font-bold text-gray-900">{member.name}</h2><p className="truncate text-xs text-gray-500">{member.designation}</p></div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${member.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-800'}`}>{member.role === 'ADMIN' ? 'Admin' : 'Sales employee'}</span>
                  </div>
                  <p className="mt-4 truncate text-xs text-gray-500">{member.email}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
                    <div><p className="text-lg font-bold text-gray-900">{assignedLeads.length}</p><p className="text-[10px] text-gray-500">Assigned</p></div>
                    <div><p className="text-lg font-bold text-gray-900">{activeLeads.length}</p><p className="text-[10px] text-gray-500">Active</p></div>
                    <div><p className="text-lg font-bold text-gray-900">{bookedLeads.length}</p><p className="text-[10px] text-gray-500">Booked</p></div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-[11px] text-gray-600">
                    {member.role === 'ADMIN' ? <ShieldCheck className="h-4 w-4 text-indigo-700" /> : <BriefcaseBusiness className="h-4 w-4 text-sky-800" />}
                    {member.role === 'ADMIN' ? 'Can manage team, properties, and all lead records.' : 'Can manage leads assigned to this account and schedule follow-ups.'}
                  </div>
                </article>
              )
            })}
          </div>
        ) : <EmptyState icon={Users} title="No team records" description="No user accounts are stored for this team yet." />}
      </div>
    </div>
  )
}
