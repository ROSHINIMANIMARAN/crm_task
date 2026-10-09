import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Users, Building2, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { leadsService } from '../../services/leads'
import { useDebounce } from '../../hooks/useDebounce'
import { getInitials } from '../../utils/formatters'

interface Props { onClose: () => void }

export function GlobalSearch({ onClose }: Props) {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const dq = useDebounce(q, 300)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const { data } = useQuery({
    queryKey: ['search', dq],
    queryFn:  () => leadsService.getLeads({ search: dq, limit: 6 }),
    enabled:  dq.length > 1,
  })

  const go = (path: string) => { navigate(path); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.15 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search leads, units, bookings…"
            className="flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-400"
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {data?.leads && data.leads.length > 0 ? (
          <div className="py-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-4 pb-1">Leads</p>
            {data.leads.map(lead => (
              <button
                key={lead.id}
                onClick={() => go(`/leads/${lead.id}`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getInitials(lead.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                  <p className="text-xs text-gray-500 truncate">{lead.leadNumber} · {lead.phone}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{lead.stage}</span>
              </button>
            ))}
          </div>
        ) : dq.length > 1 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No results for "{dq}"</div>
        ) : (
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Users,    label: 'All Leads',   path: '/leads' },
                { icon: Building2, label: 'Properties', path: '/properties' },
                { icon: BookOpen,  label: 'Bookings',   path: '/bookings' },
              ].map(a => (
                <button
                  key={a.path}
                  onClick={() => go(a.path)}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <a.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
