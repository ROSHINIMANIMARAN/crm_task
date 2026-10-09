import type { FollowUp, FollowUpType, Priority } from '../types'
import { getDemoFollowUps, getDemoLeads, saveDemoFollowUps } from './demoStore'
import { notificationsService } from './notifications'

export const followUpsService = {
  getFollowUps: async (params?: { status?: string; assignedTo?: string; type?: string; priority?: string; filter?: string; projectId?: string; page?: number; limit?: number }) => {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 20
    const filtered = getDemoFollowUps()
      .filter((item) => !params?.status || item.status === params.status)
      .filter((item) => !params?.assignedTo || item.assignedToId === params.assignedTo)
      .filter((item) => !params?.type || item.type === params.type)
      .filter((item) => !params?.priority || item.priority === params.priority)
      .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))
    const start = (page - 1) * limit
    return { followUps: filtered.slice(start, start + limit), total: filtered.length, page, totalPages: Math.ceil(filtered.length / limit) }
  },
  createFollowUp: async (fu: { leadId: string; followUpDate: string; type?: string; notes?: string; priority?: string; assignedToId?: string }) => {
    const lead = getDemoLeads().find((item) => item.id === fu.leadId)
    if (!lead) throw new Error('Select a valid lead before scheduling a follow-up')
    const followUp: FollowUp = {
      id: `demo-follow-up-${crypto.randomUUID()}`,
      leadId: lead.id,
      lead,
      assignedToId: fu.assignedToId ?? lead.assignedToId ?? 'demo-sales',
      assignedTo: lead.assignedTo ?? { id: 'demo-sales', name: 'Roshini' },
      followUpDate: new Date(fu.followUpDate).toISOString(),
      type: (fu.type ?? 'CALL') as FollowUpType,
      notes: fu.notes,
      status: 'PENDING',
      priority: (fu.priority ?? 'MEDIUM') as Priority,
      createdAt: new Date().toISOString(),
    }
    saveDemoFollowUps([followUp, ...getDemoFollowUps()])
    notificationsService.create({
      kind: 'follow-up',
      title: 'Follow-up scheduled',
      description: `${lead.name} · ${followUp.type.replace('_', ' ')}`,
      href: '/follow-ups',
    })
    return followUp
  },
  updateFollowUp: async (id: string, updates: { status?: string; outcome?: string; notes?: string; followUpDate?: string; type?: string; priority?: string }) => {
    const followUps = getDemoFollowUps()
    const index = followUps.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Follow-up not found')
    const updated = { ...followUps[index], ...updates } as FollowUp
    followUps[index] = updated
    saveDemoFollowUps(followUps)
    return updated
  },
  deleteFollowUp: async (id: string) => {
    saveDemoFollowUps(getDemoFollowUps().filter((item) => item.id !== id))
  },
}
