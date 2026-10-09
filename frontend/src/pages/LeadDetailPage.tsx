import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, Mail, MapPin, Building2, Tag, Edit2, Plus, CheckCircle, Clock, MessageSquare, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsService } from '../services/leads'
import { useAuth } from '../hooks/useAuth'
import { LeadForm } from '../components/leads/LeadForm'
import { formatDate, formatDateTime, timeAgo, STAGE_LABELS, STAGE_COLORS, PRIORITY_COLORS, SOURCE_LABELS, PROPERTY_TYPE_LABELS, FOLLOWUP_TYPE_LABELS } from '../utils/formatters'
import { PageSkeleton } from '../components/ui/Skeletons'
import type { LeadStage } from '../types'

const STAGES: LeadStage[] = ['NEW','CONTACTED','SITE_VISIT','INTERESTED','NEGOTIATION','BOOKED','LOST']

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [tab, setTab] = useState<'notes'|'activity'|'followups'>('notes')

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id, user?.id],
    queryFn: async () => {
      const record = await leadsService.getLead(id!)
      if (user?.role === 'SALES_EMPLOYEE' && record.assignedToId !== user.id) {
        throw new Error('You do not have access to this lead')
      }
      return record
    },
    enabled: !!id,
  })

  const stageMutation = useMutation({
    mutationFn: (stage: LeadStage) => leadsService.updateStage(id!, stage),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', id] }); toast.success('Stage updated') },
    onError: () => toast.error('Failed to update stage'),
  })

  const noteMutation = useMutation({
    mutationFn: () => leadsService.addNote(id!, noteText),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', id] }); setNoteText(''); toast.success('Note added') },
    onError: () => toast.error('Failed to add note'),
  })

  if (isLoading) return <PageSkeleton />
  if (!lead) return <div role="alert" className="p-6 text-sm text-gray-600">{user?.role === 'SALES_EMPLOYEE' ? 'This lead is not assigned to your account, or it no longer exists.' : 'Lead not found.'}<button onClick={() => navigate('/leads')} className="ml-2 font-semibold text-sky-800">Back to leads</button></div>

  return (
    <div className="min-h-full bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/leads')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900">{lead.name}</h1>
          <p className="text-xs text-gray-500">{lead.leadNumber} · {lead.designation}{lead.organization ? ` · ${lead.organization}` : ''}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLORS[lead.stage]}`}>{STAGE_LABELS[lead.stage]}</span>
        <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-sm hover:bg-gray-50">
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          {/* Contact info */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 card-shadow space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Contact Info</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span>{lead.phone}</span></div>
              {lead.alternatePhone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-300" /><span className="text-gray-500">{lead.alternatePhone}</span></div>}
              {lead.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span className="truncate">{lead.email}</span></div>}
            </div>
          </div>

          {/* Lead details */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 card-shadow space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Lead Details</h3>
            {[
              { label: 'Source', value: SOURCE_LABELS[lead.source] },
              { label: 'Priority', value: <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[lead.priority]}`}>{lead.priority}</span> },
              { label: 'Budget', value: lead.budget },
              { label: 'Property Type', value: lead.propertyType ? PROPERTY_TYPE_LABELS[lead.propertyType] : null },
              { label: 'Preferred Location', value: lead.preferredLocation },
              { label: 'Interested Project', value: lead.interestedProject?.name },
              { label: 'Assigned To', value: lead.assignedTo?.name },
              { label: 'Next Follow-up', value: lead.nextFollowUp ? formatDate(lead.nextFollowUp) : null },
              { label: 'Last Contacted', value: lead.lastContacted ? formatDate(lead.lastContacted) : null },
              { label: 'Created', value: formatDate(lead.createdAt) },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex items-start justify-between gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{row.label}</span>
                <span className="text-xs text-gray-800 text-right">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Interaction objective */}
          {lead.interactionObjective && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Interaction Objective</p>
              <p className="text-sm text-amber-900">{lead.interactionObjective}</p>
            </div>
          )}
        </div>

        {/* Middle: Stage pipeline */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100 card-shadow">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Stage Pipeline</h3>
            <div className="space-y-1.5">
              {STAGES.map((s, i) => {
                const currentIdx = STAGES.indexOf(lead.stage)
                const isDone = i < currentIdx
                const isCurrent = s === lead.stage
                return (
                  <button key={s} onClick={() => !isCurrent && stageMutation.mutate(s)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isCurrent ? 'bg-[#01a0e2] text-white' :
                      isDone    ? 'bg-sky-50 text-sky-700 hover:bg-[#eaf5e5] hover:text-[#4f8f27]' :
                                  'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border ${
                      isCurrent ? 'bg-white/20 border-white/50 text-white' :
                      isDone    ? 'bg-sky-500 border-sky-500 text-white' :
                                  'border-gray-300'
                    }`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    {STAGE_LABELS[s]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Follow-ups */}
          <div className="bg-white rounded-xl border border-gray-100 card-shadow">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Follow-ups ({lead.followUps?.length ?? 0})</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {lead.followUps?.slice(0, 5).map(fu => (
                <div key={fu.id} className="px-5 py-3 flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${fu.status === 'COMPLETED' ? 'bg-sky-400' : fu.status === 'PENDING' ? 'bg-sky-400' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-xs font-medium text-gray-900">{FOLLOWUP_TYPE_LABELS[fu.type]}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(fu.followUpDate)}</p>
                    {fu.notes && <p className="text-xs text-gray-400 mt-0.5">{fu.notes}</p>}
                  </div>
                </div>
              ))}
              {!lead.followUps?.length && <p className="px-5 py-4 text-xs text-gray-400">No follow-ups yet</p>}
            </div>
          </div>
        </div>

        {/* Right: Notes/Activity tabs */}
        <div className="bg-white rounded-xl border border-gray-100 card-shadow flex flex-col">
          <div className="flex border-b border-gray-100">
            {[['notes','Notes'], ['activity','Activity'], ['followups','Bookings']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key as typeof tab)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${tab === key ? 'text-[#01a0e2] border-b-2 border-[#01a0e2]' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {tab === 'notes' && (
              <div>
                {/* Add note */}
                <div className="p-4 border-b border-gray-50">
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a note…"
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <button onClick={() => noteText.trim() && noteMutation.mutate()}
                    disabled={!noteText.trim() || noteMutation.isPending}
                    className="mt-2 text-xs bg-[#01a0e2] text-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-[#eaf5e5] hover:text-[#365f22] transition-colors">
                    {noteMutation.isPending ? 'Saving…' : 'Add Note'}
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {lead.notes?.map(n => (
                    <div key={n.id} className="p-4">
                      <p className="text-xs text-gray-800 leading-relaxed">{n.content}</p>
                      {n.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {n.tags.map(t => <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{t}</span>)}
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1.5">{n.user?.name} · {timeAgo(n.createdAt)}</p>
                    </div>
                  ))}
                  {!lead.notes?.length && <p className="p-6 text-center text-xs text-gray-400">No notes yet</p>}
                </div>
              </div>
            )}

            {tab === 'activity' && (
              <div className="divide-y divide-gray-50">
                {lead.activities?.map(a => (
                  <div key={a.id} className="px-4 py-3 flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <Activity className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-700">{a.description}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {!lead.activities?.length && <p className="p-6 text-center text-xs text-gray-400">No activity yet</p>}
              </div>
            )}

            {tab === 'followups' && (
              <div className="divide-y divide-gray-50">
                {lead.bookings?.map(b => (
                  <div key={b.id} className="p-4">
                    <p className="text-xs font-semibold text-gray-900">{b.bookingNumber}</p>
                    <p className="text-xs text-gray-500">Unit {b.unit?.unitNumber} · {b.unit?.building?.project?.name}</p>
                    <p className="text-xs text-sky-600 font-medium mt-1">₹{(b.totalPrice/10_000_000).toFixed(2)} Cr · {b.status}</p>
                  </div>
                ))}
                {!lead.bookings?.length && <p className="p-6 text-center text-xs text-gray-400">No bookings yet</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {editOpen && (
        <LeadForm lead={lead} onClose={() => setEditOpen(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['lead', id] }); setEditOpen(false) }} />
      )}
    </div>
  )
}
