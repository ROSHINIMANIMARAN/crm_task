import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { BookOpen, Plus, Search, X, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { bookingsService } from '../services/bookings'
import { leadsService } from '../services/leads'
import { unitsService } from '../services/projects'
import { TableSkeleton } from '../components/ui/Skeletons'
import { EmptyState } from '../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'

const schema = z.object({
  leadId: z.string().min(1, 'Select a lead'),
  unitId: z.string().min(1, 'Select a unit'),
  bookingAmount: z.number().positive('Amount required'),
  paymentMethod: z.enum(['RTGS_NEFT','CHEQUE_DD','PAYMENT_LINK','CORPORATE_UPI']),
  bankUtr: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
})
type Form = z.infer<typeof schema>

function BookingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const [leadSearch, setLeadSearch] = useState('')
  const { data: leadsData } = useQuery({
    queryKey: ['leads-search', leadSearch, user?.id, user?.role],
    queryFn: () => leadsService.getLeads({
      search: leadSearch || undefined,
      assignedTo: user?.role === 'SALES_EMPLOYEE' ? user.id : undefined,
      limit: 10,
    }),
  })
  const { data: units } = useQuery({
    queryKey: ['units-available'],
    queryFn: () => unitsService.getUnits({ status: 'AVAILABLE' }),
  })

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'RTGS_NEFT' },
  })
  const selectedUnitId = watch('unitId')
  const selectedUnit = units?.find(u => u.id === selectedUnitId)

  const mutation = useMutation({
    mutationFn: (data: Form) => bookingsService.createBooking(data),
    onSuccess: () => { toast.success('Booking confirmed!'); onSuccess() },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Booking failed. Unit may no longer be available.')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900">New Booking</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          {/* Lead selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Lead / Client *</label>
            <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)} placeholder="Search lead by name or number…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2" />
            <select {...register('leadId')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— Select Lead —</option>
              {leadsData?.leads.filter(l => l.stage !== 'LOST' && l.stage !== 'BOOKED').map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.leadNumber})</option>
              ))}
            </select>
            {errors.leadId && <p className="text-xs text-red-500 mt-0.5">{errors.leadId.message}</p>}
          </div>

          {/* Unit selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
            <select {...register('unitId')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— Select Available Unit —</option>
              {units?.map(u => (
                <option key={u.id} value={u.id}>
                  {u.unitNumber} · {u.building?.project?.name} · {formatCurrency(u.price)}
                </option>
              ))}
            </select>
            {errors.unitId && <p className="text-xs text-red-500 mt-0.5">{errors.unitId.message}</p>}
          </div>

          {/* Unit summary */}
          {selectedUnit && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-primary-900">{selectedUnit.unitNumber}</p>
              <p className="text-primary-700 text-xs">{selectedUnit.building?.project?.name} · Floor {selectedUnit.floor}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-primary-600">Base Price:</span> <span className="font-semibold text-primary-900">{formatCurrency(selectedUnit.price)}</span></div>
                {selectedUnit.floorRisePremium > 0 && <div><span className="text-primary-600">Floor Rise:</span> <span className="font-semibold text-primary-900">{formatCurrency(selectedUnit.floorRisePremium)}</span></div>}
                {selectedUnit.parkingPrice! > 0 && <div><span className="text-primary-600">Parking:</span> <span className="font-semibold text-primary-900">{formatCurrency(selectedUnit.parkingPrice!)}</span></div>}
                <div className="col-span-2 border-t border-primary-200 pt-1 mt-1"><span className="text-primary-700 font-semibold">Total: </span><span className="font-bold text-primary-900">{formatCurrency(selectedUnit.price + selectedUnit.floorRisePremium + (selectedUnit.parkingPrice ?? 0))}</span></div>
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Token Amount (₹) *</label>
              <input {...register('bookingAmount', { valueAsNumber: true })} type="number" placeholder="500000"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {errors.bookingAmount && <p className="text-xs text-red-500 mt-0.5">{errors.bookingAmount.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method *</label>
              <select {...register('paymentMethod')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="RTGS_NEFT">RTGS / NEFT</option>
                <option value="CHEQUE_DD">Cheque / DD</option>
                <option value="PAYMENT_LINK">Payment Link</option>
                <option value="CORPORATE_UPI">Corporate UPI</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bank UTR / Reference</label>
              <input {...register('bankUtr')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
              <input {...register('bankName')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending}
              className="flex-1 bg-[#01a0e2] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#008bc9] disabled:opacity-60 flex items-center justify-center gap-2">
              {(isSubmitting || mutation.isPending) ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</> : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export function BookingsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [bookingOpen, setBookingOpen] = useState(params.has('new'))

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', search, status, page, user?.id, user?.role],
    queryFn: () => bookingsService.getBookings({
      search: search || undefined,
      status: status || undefined,
      assignedTo: user?.role === 'SALES_EMPLOYEE' ? user.id : undefined,
      page,
      limit: 20,
    }),
  })

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Bookings</h1>
          <p className="text-xs text-gray-500">{data?.total ?? 0} total bookings</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings…"
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button onClick={() => setBookingOpen(true)}
            className="flex items-center gap-1.5 bg-[#01a0e2] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#008bc9]">
            <Plus className="w-4 h-4" /> New Booking
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              {['Booking #','Client','Project / Unit','Value','Token','Payment','Date','Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          {isLoading ? <TableSkeleton rows={8} cols={8} /> : (
            <tbody className="divide-y divide-gray-50">
              {data?.bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.bookingNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 text-xs">{b.lead?.name}</p>
                    <p className="text-gray-400 text-[11px]">{b.lead?.leadNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-700">{b.project?.name}</p>
                    <p className="text-[11px] text-gray-400">{b.unit?.unitNumber} · Floor {b.unit?.floor}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-900">{formatCurrency(b.totalPrice)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{formatCurrency(b.bookingAmount)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{b.paymentMethod?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{formatDate(b.bookingDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === 'CONFIRMED' ? 'bg-sky-100 text-sky-700' : b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
        {!isLoading && data?.bookings.length === 0 && (
          <EmptyState icon={BookOpen} title="No bookings yet" description="Create the first booking." action={{ label: 'New Booking', onClick: () => setBookingOpen(true) }} />
        )}
      </div>

      <AnimatePresence>
        {bookingOpen && (
          <BookingModal
            onClose={() => setBookingOpen(false)}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ['bookings'] })
              qc.invalidateQueries({ queryKey: ['projects'] })
              qc.invalidateQueries({ queryKey: ['units'] })
              qc.invalidateQueries({ queryKey: ['leads'] })
              setBookingOpen(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
