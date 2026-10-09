import type { Booking, Building, FollowUp, Lead, Project, Unit, User } from '../types'

const LEADS_KEY = 'ef_demo_leads'
const FOLLOW_UPS_KEY = 'ef_demo_follow_ups'
const PROJECTS_KEY = 'ef_demo_projects'
const BOOKINGS_KEY = 'ef_demo_bookings'
const USERS_KEY = 'ef_demo_users'
const SAMPLE_LEADS_SEEDED_KEY = 'ef_demo_sample_leads_seeded'

export const demoUsers: User[] = [
  { id: 'demo-admin', name: 'Roshini', email: 'admin@estateflow.com', role: 'ADMIN', designation: 'Sales Lead / Admin', status: 'ACTIVE', createdAt: '2026-10-08T00:00:00.000Z' },
  { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', role: 'SALES_EMPLOYEE', designation: 'Senior Advisor', status: 'ACTIVE', createdAt: '2026-10-08T00:00:00.000Z' },
]

export const demoProjects: Pick<Project, 'id' | 'name' | 'location'>[] = [
  // Project options are derived from the user's saved property records.
]

const sampleLeads: Lead[] = [
  { id: 'sample-lead-001', leadNumber: 'MG-DEMO-001', name: 'Aarav Mehta', phone: '9000000001', email: 'aarav.mehta@example.test', source: 'PORTAL', stage: 'NEW', priority: 'HIGH', budget: '₹1.0 - 1.2 Cr', preferredLocation: 'OMR, Chennai', propertyType: 'THREE_BHK', assignedToId: 'demo-sales', assignedTo: { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', designation: 'Senior Advisor' }, createdAt: '2026-10-01T09:00:00.000Z', updatedAt: '2026-10-01T09:00:00.000Z' },
  { id: 'sample-lead-002', leadNumber: 'MG-DEMO-002', name: 'Diya Nair', phone: '9000000002', email: 'diya.nair@example.test', source: 'REFERRAL', stage: 'CONTACTED', priority: 'MEDIUM', budget: '₹80 - 95 L', preferredLocation: 'Navalur, Chennai', propertyType: 'TWO_BHK', assignedToId: 'demo-sales', assignedTo: { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', designation: 'Senior Advisor' }, interactionObjective: 'Share available two-bedroom options and confirm preferred visit time.', createdAt: '2026-10-02T09:00:00.000Z', updatedAt: '2026-10-03T09:00:00.000Z' },
  { id: 'sample-lead-003', leadNumber: 'MG-DEMO-003', name: 'Kabir Rao', phone: '9000000003', email: 'kabir.rao@example.test', source: 'DIGITAL_CAMPAIGN', stage: 'SITE_VISIT', priority: 'HIGH', budget: '₹1.2 - 1.5 Cr', preferredLocation: 'Sholinganallur, Chennai', propertyType: 'THREE_BHK_LUXURY', assignedToId: 'demo-sales', assignedTo: { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', designation: 'Senior Advisor' }, createdAt: '2026-10-03T09:00:00.000Z', updatedAt: '2026-10-05T09:00:00.000Z' },
  { id: 'sample-lead-004', leadNumber: 'MG-DEMO-004', name: 'Anika Iyer', phone: '9000000004', email: 'anika.iyer@example.test', source: 'SITE_WALK_IN', stage: 'INTERESTED', priority: 'MEDIUM', budget: '₹70 - 85 L', preferredLocation: 'Pallikaranai, Chennai', propertyType: 'TWO_BHK', assignedToId: 'demo-sales', assignedTo: { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', designation: 'Senior Advisor' }, createdAt: '2026-10-04T09:00:00.000Z', updatedAt: '2026-10-05T11:00:00.000Z' },
  { id: 'sample-lead-005', leadNumber: 'MG-DEMO-005', name: 'Vivaan Shah', phone: '9000000005', email: 'vivaan.shah@example.test', source: 'CHANNEL_PARTNER', stage: 'NEGOTIATION', priority: 'URGENT', budget: '₹1.5 - 1.8 Cr', preferredLocation: 'ECR, Chennai', propertyType: 'FOUR_BHK', assignedToId: 'demo-sales', assignedTo: { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', designation: 'Senior Advisor' }, interactionObjective: 'Discuss final pricing and payment schedule.', createdAt: '2026-10-05T09:00:00.000Z', updatedAt: '2026-10-06T09:00:00.000Z' },
  { id: 'sample-lead-006', leadNumber: 'MG-DEMO-006', name: 'Meera Krishnan', phone: '9000000006', email: 'meera.krishnan@example.test', source: 'REFERRAL', stage: 'NEW', priority: 'LOW', budget: '₹60 - 75 L', preferredLocation: 'Medavakkam, Chennai', propertyType: 'TWO_BHK', assignedToId: 'demo-sales', assignedTo: { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', designation: 'Senior Advisor' }, createdAt: '2026-10-06T09:00:00.000Z', updatedAt: '2026-10-06T09:00:00.000Z' },
  { id: 'sample-lead-007', leadNumber: 'MG-DEMO-007', name: 'Arjun Menon', phone: '9000000007', email: 'arjun.menon@example.test', source: 'DIRECT', stage: 'CONTACTED', priority: 'MEDIUM', budget: '₹95 L - 1.1 Cr', preferredLocation: 'Thoraipakkam, Chennai', propertyType: 'THREE_BHK', assignedToId: 'demo-sales', assignedTo: { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', designation: 'Senior Advisor' }, createdAt: '2026-10-06T11:00:00.000Z', updatedAt: '2026-10-07T09:00:00.000Z' },
  { id: 'sample-lead-008', leadNumber: 'MG-DEMO-008', name: 'Ishita Bose', phone: '9000000008', email: 'ishita.bose@example.test', source: 'PORTAL', stage: 'SITE_VISIT', priority: 'HIGH', budget: '₹1.1 - 1.4 Cr', preferredLocation: 'Navalur, Chennai', propertyType: 'THREE_BHK_LUXURY', assignedToId: 'demo-sales', assignedTo: { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', designation: 'Senior Advisor' }, createdAt: '2026-10-07T09:00:00.000Z', updatedAt: '2026-10-08T09:00:00.000Z' },
  { id: 'sample-lead-009', leadNumber: 'MG-DEMO-009', name: 'Reyansh Pillai', phone: '9000000009', email: 'reyansh.pillai@example.test', source: 'NRI_REFERRAL', stage: 'INTERESTED', priority: 'MEDIUM', budget: '₹1.3 - 1.6 Cr', preferredLocation: 'ECR, Chennai', propertyType: 'VILLA', assignedToId: 'demo-sales', assignedTo: { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', designation: 'Senior Advisor' }, createdAt: '2026-10-08T09:00:00.000Z', updatedAt: '2026-10-08T10:00:00.000Z' },
  { id: 'sample-lead-010', leadNumber: 'MG-DEMO-010', name: 'Sana Thomas', phone: '9000000010', email: 'sana.thomas@example.test', source: 'DIGITAL_CAMPAIGN', stage: 'LOST', priority: 'LOW', budget: '₹75 - 90 L', preferredLocation: 'OMR, Chennai', propertyType: 'TWO_BHK', assignedToId: 'demo-sales', assignedTo: { id: 'demo-sales', name: 'Roshini', email: 'sales1@estateflow.com', designation: 'Senior Advisor' }, interactionObjective: 'Closed after customer chose a different location.', createdAt: '2026-10-08T11:00:00.000Z', updatedAt: '2026-10-08T12:00:00.000Z' },
]

function readArray<T>(key: string, initial: () => T[]): T[] {
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed as T[]
      throw new Error(`Stored demo data for ${key} is not an array`)
    } catch (error) {
      localStorage.removeItem(key)
      if (error instanceof SyntaxError) return initial()
      throw error
    }
  }
  return initial()
}

export function getDemoLeads(): Lead[] {
  const leads = readArray<Lead>(LEADS_KEY, () => [])
  const currentLeads = leads.filter((lead) => !/^demo-lead-\d+$/.test(lead.id) || !/^lead\d+@example\.com$/.test(lead.email ?? ''))
  const seededLeads = localStorage.getItem(SAMPLE_LEADS_SEEDED_KEY)
    ? currentLeads
    : [...currentLeads, ...sampleLeads.filter((sample) => !currentLeads.some((lead) => lead.id === sample.id))]
  if (seededLeads.length !== leads.length || !localStorage.getItem(LEADS_KEY)) saveDemoLeads(seededLeads)
  if (!localStorage.getItem(SAMPLE_LEADS_SEEDED_KEY)) localStorage.setItem(SAMPLE_LEADS_SEEDED_KEY, 'true')
  return seededLeads
}

export function saveDemoLeads(leads: Lead[]): void {
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads))
}

export function getDemoFollowUps(): FollowUp[] {
  const followUps = readArray<FollowUp>(FOLLOW_UPS_KEY, () => [])
  const currentLeadIds = new Set(getDemoLeads().map((lead) => lead.id))
  const currentFollowUps = followUps.filter((followUp) => currentLeadIds.has(followUp.leadId))
  if (currentFollowUps.length !== followUps.length) saveDemoFollowUps(currentFollowUps)
  if (!localStorage.getItem(FOLLOW_UPS_KEY)) saveDemoFollowUps(followUps)
  return currentFollowUps
}

export function saveDemoFollowUps(followUps: FollowUp[]): void {
  localStorage.setItem(FOLLOW_UPS_KEY, JSON.stringify(followUps))
}

export function getDemoProjects(): Project[] {
  return readArray<Project>(PROJECTS_KEY, () => [])
}

export function saveDemoProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export function getDemoUsers(): User[] {
  const stored = readArray<User>(USERS_KEY, () => demoUsers)
  const knownAccounts = new Map(demoUsers.map((user) => [user.email, user]))
  const filteredUsers = stored.flatMap((user) => {
    const account = knownAccounts.get(user.email)
    const hasCustomName = localStorage.getItem(`ef_profile_customized:${user.email}`) === 'true'
    const profileData = localStorage.getItem(`ef_profile:${user.email}`)
    let profile: Partial<User> = {}
    if (profileData) {
      try {
        const parsed: unknown = JSON.parse(profileData)
        if (typeof parsed === 'object' && parsed !== null) profile = parsed as Partial<User>
        else throw new Error(`Stored profile for ${user.email} is not an object`)
      } catch (error) {
        if (error instanceof SyntaxError) localStorage.removeItem(`ef_profile:${user.email}`)
        else throw error
      }
    }
    return account ? [{
      ...account,
      ...profile,
      name: profile.name ?? (hasCustomName && user.name ? user.name : account.name),
    }] : []
  })
  const currentUsers = filteredUsers.length ? filteredUsers : demoUsers
  if (currentUsers.length !== stored.length || !localStorage.getItem(USERS_KEY)) saveDemoUsers(currentUsers)
  return currentUsers
}

export function saveDemoUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getDemoBookings(): Booking[] {
  return readArray<Booking>(BOOKINGS_KEY, () => [])
}

export function saveDemoBookings(bookings: Booking[]): void {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings))
}

export function createDemoProject(input: Pick<Project, 'name' | 'location' | 'status'>): Project {
  const project: Project = {
    ...input,
    id: `demo-project-${crypto.randomUUID()}`,
    buildings: [],
    totalUnits: 0,
    availableUnits: 0,
    bookedUnits: 0,
    reservedUnits: 0,
    createdAt: new Date().toISOString(),
  }
  saveDemoProjects([project, ...getDemoProjects()])
  return project
}

export function createDemoBuilding(projectId: string, input: Pick<Building, 'name' | 'floors'>): Building {
  const projects = getDemoProjects()
  const projectIndex = projects.findIndex((item) => item.id === projectId)
  if (projectIndex < 0) throw new Error('Project not found')
  const building: Building = {
    ...input,
    id: `demo-building-${crypto.randomUUID()}`,
    projectId,
    project: { id: projectId, name: projects[projectIndex].name },
    totalUnits: 0,
    units: [],
    createdAt: new Date().toISOString(),
  }
  projects[projectIndex].buildings = [...(projects[projectIndex].buildings ?? []), building]
  saveDemoProjects(projects)
  return building
}

export function createDemoUnit(buildingId: string, input: Pick<Unit, 'unitNumber' | 'type' | 'floor' | 'area' | 'price'>): Unit {
  const projects = getDemoProjects()
  const project = projects.find((item) => item.buildings?.some((building) => building.id === buildingId))
  const building = project?.buildings?.find((item) => item.id === buildingId)
  if (!project || !building) throw new Error('Building not found')
  if (building.units?.some((unit) => unit.unitNumber.toLowerCase() === input.unitNumber.toLowerCase())) {
    throw new Error('That unit number already exists in this building')
  }
  const unit: Unit = {
    ...input,
    id: `demo-unit-${crypto.randomUUID()}`,
    buildingId,
    status: 'AVAILABLE',
    floorRisePremium: 0,
    isReraCompliant: true,
    createdAt: new Date().toISOString(),
  }
  building.units = [...(building.units ?? []), unit]
  building.totalUnits = building.units.length
  project.totalUnits = (project.totalUnits ?? 0) + 1
  project.availableUnits = (project.availableUnits ?? 0) + 1
  saveDemoProjects(projects)
  return unit
}
