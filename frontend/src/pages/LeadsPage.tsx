import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { leadsService } from '../services/leads'
import { useDebounce } from '../hooks/useDebounce'
import { TableSkeleton } from '../components/ui/Skeletons'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { LeadForm } from '../components/leads/LeadForm'
import { formatDate, STAGE_LABELS, STAGE_COLORS, PRIORITY_COLORS, SOURCE_LABELS } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'
import type { Lead, LeadStage } from '../types'

const STAGES: LeadStage[] = ['NEW','CONTACTED','SITE_VISIT','INTERESTED','NEGOTIATION','BOOKED','LOST']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

interface FilterOption {
  value: string
  label: string
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const selectedIndex = Math.max(options.findIndex((option) => option.value === value), 0)
  const selectedLabel = options[selectedIndex]?.label ?? label

  useEffect(() => {
    if (!open) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [open])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      setHighlightedIndex(-1)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setHighlightedIndex(selectedIndex)
        return
      }
      setHighlightedIndex((current) => (
        event.key === 'ArrowDown'
          ? (current + 1) % options.length
          : (current - 1 + options.length) % options.length
      ))
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setOpen(true)
      setHighlightedIndex(0)
    }
    if (event.key === 'End') {
      event.preventDefault()
      setOpen(true)
      setHighlightedIndex(options.length - 1)
    }
    if (event.key === 'Enter' && open && highlightedIndex >= 0) {
      event.preventDefault()
      onChange(options[highlightedIndex].value)
      setOpen(false)
      setHighlightedIndex(-1)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative min-w-0"
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          setHighlightedIndex(-1)
          setOpen((current) => !current)
        }}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6AB536]/25 xl:w-auto"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-64 min-w-full w-max max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg shadow-gray-900/10"
        >
          {options.map((option, index) => {
            const selected = option.value === value
            const highlighted = index === highlightedIndex
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  highlighted
                    ? 'bg-[#6AB536] text-white'
                    : selected
                      ? 'bg-[#f2f8ec] font-medium text-[#4f8a25]'
                      : 'text-gray-700 hover:bg-[#6AB536] hover:text-white'
                }`}
              >
                <span>{option.label}</span>
                {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function LeadsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState(params.get('stage') ?? '')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(params.has('new'))
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null)
  const dSearch = useDebounce(search, 350)

  const { data, isLoading } = useQuery({
    queryKey: ['leads', dSearch, stage, priority, page, user?.id, user?.role],
    queryFn: () => leadsService.getLeads({
      search: dSearch || undefined,
      stage: stage || undefined,
      priority: priority || undefined,
      assignedTo: user?.role === 'SALES_EMPLOYEE' ? user.id : undefined,
      page,
      limit: 20,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsService.deleteLead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); setDeleteLead(null); toast.success('Lead deleted') },
    onError: () => toast.error('Failed to delete lead'),
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-stretch gap-3 border-b border-gray-100 bg-white px-4 py-4 sm:px-6 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Leads</h1>
          <p className="text-xs text-gray-500">{data?.total ?? 0} total leads</p>
        </div>
        <div className="grid w-full min-w-0 grid-cols-2 gap-2 xl:ml-auto xl:flex xl:w-auto xl:flex-nowrap xl:items-center">
          {/* Search */}
          <div className="relative col-span-2 min-w-0 xl:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name, phone, lead #…"
              className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 xl:w-56" />
          </div>
          {/* Stage filter */}
          <FilterDropdown
            label="Lead stage"
            value={stage}
            options={[{ value: '', label: 'All Stages' }, ...STAGES.map((item) => ({ value: item, label: STAGE_LABELS[item] }))]}
            onChange={(value) => { setStage(value); setPage(1) }}
          />
          {/* Priority filter */}
          <FilterDropdown
            label="Lead priority"
            value={priority}
            options={[{ value: '', label: 'All Priorities' }, ...PRIORITIES.map((item) => ({ value: item, label: item }))]}
            onChange={(value) => { setPriority(value); setPage(1) }}
          />
          <button onClick={() => setFormOpen(true)}
            className="col-span-2 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#01a0e2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#008bc9] xl:col-span-1">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="px-6 py-2 bg-white border-b border-gray-100 flex gap-1 overflow-x-auto no-scrollbar">
        <button onClick={() => { setStage(''); setPage(1) }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${!stage ? 'bg-[#01a0e2] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          All ({data?.total ?? 0})
        </button>
        {STAGES.map(s => (
          <button key={s} onClick={() => { setStage(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${stage === s ? 'bg-[#01a0e2] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              {['Lead', 'Contact', 'Source', 'Stage', 'Priority', 'Assigned To', 'Next Follow-up', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          {isLoading ? <TableSkeleton rows={8} cols={8} /> : (
            <tbody className="divide-y divide-gray-50">
              {data?.leads.map(lead => (
                <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => window.location.href = `/leads/${lead.id}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 text-xs">{lead.name}</p>
                    <p className="text-gray-400 text-[11px] font-mono">{lead.leadNumber}</p>
                    {lead.organization && <p className="text-gray-500 text-[11px] truncate max-w-[120px]">{lead.organization}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-700">{lead.phone}</p>
                    {lead.email && <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{lead.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{SOURCE_LABELS[lead.source]}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[lead.stage]}`}>{STAGE_LABELS[lead.stage]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[lead.priority]}`}>{lead.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{lead.assignedTo?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setEditLead(lead)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil className="w-3.5 h-3.5" /></button>
                      {user?.role === 'ADMIN' && <button onClick={() => setDeleteLead(lead)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          )}
        </table>
        {!isLoading && data?.leads.length === 0 && (
          <EmptyState icon={Users} title="No leads found" description="Try adjusting your search or add a new lead." action={{ label: 'Add Lead', onClick: () => setFormOpen(true) }} />
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="px-6 py-3 bg-white border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">Page {page} of {data.totalPages} · {data.total} leads</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === data.totalPages} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Forms / Modals */}
      <AnimatePresence>
        {(formOpen || editLead) && (
          <LeadForm
            lead={editLead ?? undefined}
            onClose={() => { setFormOpen(false); setEditLead(null) }}
            onSuccess={() => { qc.invalidateQueries({ queryKey: ['leads'] }); setFormOpen(false); setEditLead(null) }}
          />
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={!!deleteLead}
        title="Delete Lead"
        message={`Delete lead "${deleteLead?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteLead && deleteMutation.mutate(deleteLead.id)}
        onCancel={() => setDeleteLead(null)}
      />
    </div>
  )
}
