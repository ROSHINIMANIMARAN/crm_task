import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, CheckCircle2, Clock3, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyState } from '../components/ui/EmptyState'
import { leadsService } from '../services/leads'
import { followUpsService } from '../services/followUps'
import { useAuth } from '../hooks/useAuth'
import type { FollowUp } from '../types'

function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function localDateTimeMin() {
  const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
  return localNow.toISOString().slice(0, 16)
}

export function FollowUpsPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(params.get('new') === 'true')
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['follow-ups', user?.id, user?.role],
    queryFn: () => followUpsService.getFollowUps({ assignedTo: user?.role === 'SALES_EMPLOYEE' ? user.id : undefined, limit: 500 }),
  })
  const { data: leadsData } = useQuery({
    queryKey: ['leads', 'follow-up-options', user?.id, user?.role],
    queryFn: () => leadsService.getLeads({ assignedTo: user?.role === 'SALES_EMPLOYEE' ? user.id : undefined, limit: 500 }),
  })

  const createMutation = useMutation({
    mutationFn: (values: { leadId: string; followUpDate: string; type: string; priority: string; notes: string }) =>
      followUpsService.createFollowUp(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
      setFormOpen(false)
      setParams((current) => {
        current.delete('new')
        return current
      }, { replace: true })
      toast.success('Follow-up scheduled')
    },
    onError: () => toast.error('Could not schedule follow-up'),
  })

  const updateMutation = useMutation({
    mutationFn: (followUp: FollowUp) => followUpsService.updateFollowUp(followUp.id, { status: 'COMPLETED' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
      toast.success('Follow-up marked complete')
    },
    onError: () => toast.error('Could not update follow-up'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => followUpsService.deleteFollowUp(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
      toast.success('Follow-up removed')
    },
    onError: () => toast.error('Could not remove follow-up'),
  })

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const date = String(values.get('followUpDate') ?? '')
    createMutation.mutate({
      leadId: String(values.get('leadId') ?? ''),
      followUpDate: new Date(date).toISOString(),
      type: String(values.get('type') ?? 'CALL'),
      priority: String(values.get('priority') ?? 'MEDIUM'),
      notes: String(values.get('notes') ?? '').trim(),
    })
  }

  const closeForm = () => {
    setFormOpen(false)
    setParams((current) => {
      current.delete('new')
      return current
    }, { replace: true })
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Follow-ups</h1>
            <p className="mt-1 text-xs text-gray-500">Keep every lead conversation on schedule.</p>
          </div>
          <button onClick={() => setFormOpen(true)} className="flex items-center gap-2 rounded-xl bg-[#01a0e2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#008bc9]">
            <Plus className="h-4 w-4" /> Schedule follow-up
          </button>
        </header>

        {formOpen && (
          <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-2">
            <h2 className="text-sm font-semibold text-gray-900 md:col-span-2">Schedule a follow-up</h2>
            <label className="text-xs font-medium text-gray-600">
              Lead *
              <select name="leadId" required className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
                <option value="">Select a lead</option>
                {leadsData?.leads.filter((lead) => lead.stage !== 'LOST' && lead.stage !== 'BOOKED').map((lead) => (
                  <option key={lead.id} value={lead.id}>{lead.name} · {lead.leadNumber}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-gray-600">
              Date and time *
              <input name="followUpDate" type="datetime-local" required min={localDateTimeMin()} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Action type
              <select name="type" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
                <option value="CALL">Call</option>
                <option value="SITE_VISIT">Site visit</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="NEGOTIATION">Negotiation</option>
              </select>
            </label>
            <label className="text-xs font-medium text-gray-600">
              Priority
              <select name="priority" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
            <label className="text-xs font-medium text-gray-600 md:col-span-2">
              Notes
              <textarea name="notes" rows={2} placeholder="What should be discussed?" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
            </label>
            <div className="flex justify-end gap-2 md:col-span-2">
              <button type="button" onClick={closeForm} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button disabled={createMutation.isPending} className="rounded-xl bg-[#01a0e2] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {createMutation.isPending ? 'Saving…' : 'Save follow-up'}
              </button>
            </div>
          </form>
        )}

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500"><Clock3 className="h-4 w-4 animate-pulse" /> Loading follow-ups…</div>
          ) : data?.followUps.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>{['Lead', 'Scheduled', 'Type', 'Priority', 'Notes', 'Status', ''].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.followUps.map((item) => (
                    <tr key={item.id} className="text-sm hover:bg-gray-50/70">
                      <td className="px-4 py-3"><p className="font-semibold text-gray-900">{item.lead?.name ?? 'Lead'}</p><p className="text-xs text-gray-500">{item.lead?.leadNumber}</p></td>
                      <td className="px-4 py-3 text-xs text-gray-700">{dateTime(item.followUpDate)}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{item.type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{item.priority}</td>
                      <td className="max-w-48 px-4 py-3 text-xs text-gray-500">{item.notes || '—'}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.status === 'COMPLETED' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span></td>
                      <td className="px-4 py-3"><div className="flex gap-1">
                        {item.status !== 'COMPLETED' && <button aria-label="Mark complete" title="Mark complete" onClick={() => updateMutation.mutate(item)} className="rounded-lg p-2 text-sky-700 hover:bg-sky-50"><CheckCircle2 className="h-4 w-4" /></button>}
                        <button aria-label="Delete follow-up" title="Delete follow-up" onClick={() => deleteMutation.mutate(item.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={CalendarClock} title="No follow-ups scheduled" description="Schedule a call, visit, or reminder to keep a lead moving." action={{ label: 'Schedule follow-up', onClick: () => setFormOpen(true) }} />
          )}
        </section>
      </div>
    </div>
  )
}
