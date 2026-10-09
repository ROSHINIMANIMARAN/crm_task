import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { X, Loader2 } from 'lucide-react'
import { leadsService } from '../../services/leads'
import { getDemoProjects, getDemoUsers } from '../../services/demoStore'
import { SOURCE_LABELS, PROPERTY_TYPE_LABELS, STAGE_LABELS } from '../../utils/formatters'
import { useAuth } from '../../hooks/useAuth'
import type { Lead } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  phone: z.string().min(10, 'Valid phone required'),
  email: z.string().email().optional().or(z.literal('')),
  alternatePhone: z.string().optional(),
  designation: z.string().optional(),
  organization: z.string().optional(),
  source: z.enum(['PORTAL','REFERRAL','CHANNEL_PARTNER','DIRECT','SITE_WALK_IN','DIGITAL_CAMPAIGN','NRI_REFERRAL']),
  budget: z.string().optional(),
  preferredLocation: z.string().optional(),
  propertyType: z.enum(['TWO_BHK','THREE_BHK','THREE_BHK_LUXURY','FOUR_BHK','PENTHOUSE','VILLA','PLOT']).optional().or(z.literal('')),
  stage: z.enum(['NEW','CONTACTED','SITE_VISIT','INTERESTED','NEGOTIATION','BOOKED','LOST']).default('NEW'),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).default('MEDIUM'),
  assignedToId: z.string().optional(),
  interestedProjectId: z.string().optional(),
  interactionObjective: z.string().optional(),
})

type Form = z.input<typeof schema>

interface Props { lead?: Lead; onClose: () => void; onSuccess: () => void }

export function LeadForm({ lead, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateX = useSpring(pointerX, { stiffness: 180, damping: 24 })
  const rotateY = useSpring(pointerY, { stiffness: 180, damping: 24 })
  const salesUsers = getDemoUsers().filter((salesUser) => salesUser.role === 'SALES_EMPLOYEE')
  const projects = getDemoProjects()

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set(((bounds.top + bounds.height / 2 - event.clientY) / bounds.height) * 1.6)
    pointerY.set(((event.clientX - bounds.left - bounds.width / 2) / bounds.width) * 1.6)
  }

  const resetPointerTilt = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: lead ? {
      name: lead.name, phone: lead.phone, email: lead.email ?? '',
      alternatePhone: lead.alternatePhone ?? '', designation: lead.designation ?? '',
      organization: lead.organization ?? '', source: lead.source, budget: lead.budget ?? '',
      preferredLocation: lead.preferredLocation ?? '',
      propertyType: lead.propertyType ?? undefined, stage: lead.stage, priority: lead.priority,
      assignedToId: lead.assignedToId ?? '', interestedProjectId: lead.interestedProjectId ?? '',
      interactionObjective: lead.interactionObjective ?? '',
    } : {
      source: 'PORTAL',
      stage: 'NEW',
      priority: 'MEDIUM',
      assignedToId: user?.role === 'SALES_EMPLOYEE' ? user.id : '',
    },
  })

  const onSubmit = async (data: Form) => {
    try {
      if (lead) {
        await leadsService.updateLead(lead.id, { ...data, propertyType: data.propertyType || undefined })
        toast.success('Lead updated')
      } else {
        await leadsService.createLead({ ...data, propertyType: data.propertyType || undefined })
        toast.success('Lead created')
      }
      qc.invalidateQueries({ queryKey: ['leads'] })
      onSuccess()
    } catch {
      toast.error('Failed to save lead')
    }
  }

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
  const selectClass = inputClass

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, backdropFilter: 'blur(7px)' }}
        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="absolute inset-0 bg-slate-950/35"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.96, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.97, y: 8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointerTilt}
        style={{ rotateX: rotateX, rotateY: rotateY, transformPerspective: 1000 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-form-title"
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="lead-form-title" className="text-base font-bold text-gray-900">{lead ? 'Edit Lead' : 'Add New Lead'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Section: Contact */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name *" error={errors.name?.message}>
                <input {...register('name')} className={inputClass} placeholder="Vikram Sharma" />
              </Field>
              <Field label="Phone *" error={errors.phone?.message}>
                <input {...register('phone')} className={inputClass} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input {...register('email')} type="email" className={inputClass} placeholder="email@example.com" />
              </Field>
              <Field label="Alternate Phone">
                <input {...register('alternatePhone')} className={inputClass} />
              </Field>
              <Field label="Designation">
                <input {...register('designation')} className={inputClass} placeholder="VP Engineering" />
              </Field>
              <Field label="Organization">
                <input {...register('organization')} className={inputClass} placeholder="TechCorp" />
              </Field>
            </div>
          </div>

          {/* Section: Lead */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lead Details</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Source *" error={errors.source?.message}>
                <select {...register('source')} className={selectClass}>
                  {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Stage">
                <select {...register('stage')} className={selectClass}>
                  {Object.entries(STAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select {...register('priority')} className={selectClass}>
                  {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Property Type" error={errors.propertyType?.message}>
                <select {...register('propertyType')} className={selectClass}>
                  <option value="">— Select —</option>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Budget">
                <input {...register('budget')} className={inputClass} placeholder="₹1.20 - 1.40 Cr" />
              </Field>
              <Field label="Preferred Location">
                <input {...register('preferredLocation')} className={inputClass} placeholder="OMR / Navalur" />
              </Field>
            </div>
          </div>

          {/* Section: Assignment */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assignment</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Assigned To">
                <select {...register('assignedToId')} className={selectClass}>
                  <option value="">— Unassigned —</option>
                  {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.designation})</option>)}
                </select>
              </Field>
              <Field label="Interested Project">
                <select {...register('interestedProjectId')} className={selectClass}>
                  <option value="">— None —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Interaction objective */}
          <Field label="Interaction Objective / Notes">
            <textarea {...register('interactionObjective')} rows={3}
              className={`${inputClass} resize-none`}
              placeholder="What is the goal of the next interaction?" />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-[#01a0e2] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#eaf5e5] hover:text-[#365f22] disabled:opacity-60 flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
