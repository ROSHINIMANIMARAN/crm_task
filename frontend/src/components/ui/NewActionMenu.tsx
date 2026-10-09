import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Building2, BookOpen, PhoneCall } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props { onClose: () => void }

export function NewActionMenu({ onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const go = (path: string) => { navigate(path); onClose() }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
    >
      {[
        { icon: Users,     label: 'New Lead',          path: '/leads?new=true' },
        { icon: PhoneCall, label: 'Schedule Follow-up', path: '/follow-ups?new=true' },
        { icon: BookOpen,  label: 'New Booking',        path: '/bookings?new=true' },
        { icon: Building2, label: 'Add Project',        path: '/properties?new=true' },
      ].map(a => (
        <button
          key={a.label}
          onClick={() => go(a.path)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 text-left transition-colors"
        >
          <a.icon className="w-4 h-4 text-gray-400" />
          {a.label}
        </button>
      ))}
    </motion.div>
  )
}
