import type { Lead, LeadStage, Note } from '../types'
import { getDemoLeads, getDemoProjects, getDemoUsers, saveDemoLeads } from './demoStore'
import { followUpsService } from './followUps'
import { notificationsService } from './notifications'

export interface LeadsQuery {
  search?: string; stage?: string; assignedTo?: string
  priority?: string; page?: number; limit?: number; projectId?: string
}

export const leadsService = {
  getLeads: async (params: LeadsQuery = {}) => {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const search = params.search?.trim().toLowerCase()
    const filtered = getDemoLeads()
      .filter((lead) => !search || [lead.name, lead.phone, lead.leadNumber, lead.email].some((value) => value?.toLowerCase().includes(search)))
      .filter((lead) => !params.stage || lead.stage === params.stage)
      .filter((lead) => !params.priority || lead.priority === params.priority)
      .filter((lead) => !params.assignedTo || lead.assignedToId === params.assignedTo)
      .filter((lead) => !params.projectId || lead.interestedProjectId === params.projectId)
    const start = (page - 1) * limit
    return {
      leads: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    }
  },
  getLead: async (id: string) => {
    const lead = getDemoLeads().find((item) => item.id === id)
    if (!lead) throw new Error('Lead not found')
    return lead
  },
  createLead: async (lead: Partial<Lead>) => {
    const leads = getDemoLeads()
    const now = new Date().toISOString()
    const nextNumber = leads.reduce((max, item) => {
      const parts = item.leadNumber.split('-')
      return Math.max(max, Number(parts[parts.length - 1]) || 0)
    }, 0) + 1
    const created: Lead = {
      id: `demo-lead-${crypto.randomUUID()}`,
      leadNumber: `EF-2026-${String(nextNumber).padStart(3, '0')}`,
      name: lead.name ?? '',
      phone: lead.phone ?? '',
      source: lead.source ?? 'DIRECT',
      stage: lead.stage ?? 'NEW',
      priority: lead.priority ?? 'MEDIUM',
      ...lead,
      assignedTo: lead.assignedToId ? getDemoUsers().find((user) => user.id === lead.assignedToId) : undefined,
      interestedProject: lead.interestedProjectId ? getDemoProjects().find((project) => project.id === lead.interestedProjectId) : undefined,
      createdAt: now,
      updatedAt: now,
    }
    saveDemoLeads([created, ...leads])
    notificationsService.create({
      kind: 'lead',
      title: 'New lead created',
      description: `${created.name} · ${created.leadNumber}`,
      href: `/leads/${created.id}`,
    })
    return created
  },
  updateLead: async (id: string, lead: Partial<Lead>) => {
    const leads = getDemoLeads()
    const index = leads.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Lead not found')
    const updated = {
      ...leads[index],
      ...lead,
      assignedTo: lead.assignedToId ? getDemoUsers().find((user) => user.id === lead.assignedToId) : leads[index].assignedTo,
      interestedProject: lead.interestedProjectId ? getDemoProjects().find((project) => project.id === lead.interestedProjectId) : leads[index].interestedProject,
      updatedAt: new Date().toISOString(),
    }
    leads[index] = updated
    saveDemoLeads(leads)
    return updated
  },
  deleteLead: async (id: string) => {
    saveDemoLeads(getDemoLeads().filter((item) => item.id !== id))
  },
  updateStage: async (id: string, stage: string) => {
    const leads = getDemoLeads()
    const index = leads.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Lead not found')
    const updated = { ...leads[index], stage: stage as LeadStage, updatedAt: new Date().toISOString() }
    leads[index] = updated
    saveDemoLeads(leads)
    return updated
  },
  addNote: async (id: string, content: string, tags: string[] = []) => {
    const leads = getDemoLeads()
    const index = leads.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Lead not found')
    const note: Note = {
      id: `demo-note-${crypto.randomUUID()}`,
      leadId: id,
      userId: 'demo-user',
      content,
      tags,
      createdAt: new Date().toISOString(),
    }
    leads[index] = { ...leads[index], notes: [...(leads[index].notes ?? []), note], updatedAt: new Date().toISOString() }
    saveDemoLeads(leads)
    return note
  },
  addFollowUp: async (id: string, fu: { followUpDate: string; type?: string; notes?: string; priority?: string; assignedToId?: string }) => {
    return followUpsService.createFollowUp({ leadId: id, ...fu })
  },
}
