export type Role = 'ADMIN' | 'SALES_EMPLOYEE'
export type LeadStage = 'NEW' | 'CONTACTED' | 'SITE_VISIT' | 'INTERESTED' | 'NEGOTIATION' | 'BOOKED' | 'LOST'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type LeadSource = 'PORTAL' | 'REFERRAL' | 'CHANNEL_PARTNER' | 'DIRECT' | 'SITE_WALK_IN' | 'DIGITAL_CAMPAIGN' | 'NRI_REFERRAL'
export type PropertyType = 'TWO_BHK' | 'THREE_BHK' | 'THREE_BHK_LUXURY' | 'FOUR_BHK' | 'PENTHOUSE' | 'VILLA' | 'PLOT'
export type UnitStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED'
export type ProjectStatus = 'ACTIVE' | 'READY' | 'UPCOMING'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED'
export type FollowUpType = 'CALL' | 'SITE_VISIT' | 'WHATSAPP' | 'EMAIL' | 'NEGOTIATION' | 'MEETING'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  designation?: string
  phone?: string
  department?: string
  location?: string
  bio?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  _count?: { assignedLeads: number; bookings: number }
}

export interface Lead {
  id: string
  leadNumber: string
  name: string
  phone: string
  email?: string
  alternatePhone?: string
  designation?: string
  organization?: string
  source: LeadSource
  budget?: string
  preferredLocation?: string
  propertyType?: PropertyType
  stage: LeadStage
  priority: Priority
  assignedToId?: string
  assignedTo?: Pick<User, 'id' | 'name' | 'email' | 'designation'>
  interestedProjectId?: string
  interestedProject?: Pick<Project, 'id' | 'name' | 'location'>
  nextFollowUp?: string
  lastContacted?: string
  interactionObjective?: string
  notes?: Note[]
  activities?: Activity[]
  followUps?: FollowUp[]
  bookings?: Booking[]
  _count?: { notes: number; followUps: number }
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  location: string
  description?: string
  status: ProjectStatus
  reraNumber?: string
  totalArea?: string
  handoverDate?: string
  corridorDistance?: string
  buildings?: Building[]
  totalUnits?: number
  availableUnits?: number
  bookedUnits?: number
  reservedUnits?: number
  absorbedUnits?: number
  _count?: { leads: number; bookings: number }
  createdAt: string
}

export interface Building {
  id: string
  projectId: string
  project?: Pick<Project, 'id' | 'name'>
  name: string
  floors: number
  totalUnits: number
  units?: Unit[]
  createdAt: string
}

export interface Unit {
  id: string
  buildingId: string
  building?: Building & { project?: Project }
  unitNumber: string
  type: PropertyType
  floor: number
  area: number
  carpetArea?: number
  price: number
  status: UnitStatus
  orientation?: string
  floorRisePremium: number
  parkingPrice?: number
  isReraCompliant: boolean
  lockedByUserId?: string
  lockedUntil?: string
  bookings?: Booking[]
  createdAt: string
}

export interface Booking {
  id: string
  bookingNumber: string
  leadId: string
  lead?: Pick<Lead, 'id' | 'name' | 'phone' | 'leadNumber' | 'designation' | 'organization'>
  unitId: string
  unit?: Unit
  projectId: string
  project?: Pick<Project, 'id' | 'name' | 'location'>
  salesEmployeeId: string
  salesEmployee?: Pick<User, 'id' | 'name' | 'designation' | 'phone'>
  bookingAmount: number
  totalPrice: number
  paymentMethod: string
  bankUtr?: string
  bankName?: string
  bookingDate: string
  status: BookingStatus
  notes?: string
  createdAt: string
}

export interface FollowUp {
  id: string
  leadId: string
  lead?: Lead & { interestedProject?: Pick<Project, 'id' | 'name'> }
  assignedToId: string
  assignedTo?: Pick<User, 'id' | 'name'>
  followUpDate: string
  type: FollowUpType
  notes?: string
  outcome?: string
  status: FollowUpStatus
  priority: Priority
  createdAt: string
}

export interface Note {
  id: string
  leadId: string
  userId: string
  user?: Pick<User, 'id' | 'name'>
  content: string
  tags: string[]
  createdAt: string
}

export interface Activity {
  id: string
  leadId: string
  userId: string
  user?: Pick<User, 'id' | 'name'>
  action: string
  description: string
  createdAt: string
}

export interface DashboardData {
  stats: {
    totalLeads: number
    newLeads: number
    siteVisits: number
    interested: number
    inNegotiation: number
    bookings: number
    availableUnits: number
    followUpsDueToday: number
    overdueFollowUps: number
  }
  stageCounts: { stage: LeadStage; count: number }[]
  sourceCounts: { source: LeadSource; count: number }[]
  monthlyBookings: { month: string; count: number; value: number }[]
  todayFollowUps: FollowUp[]
  recentBookingsDetail: Booking[]
  salesPerformance: { id: string; name: string; designation?: string; deals: number; grossValue: number; conversion: number }[]
  inventoryByProject: { projectId: string; projectName: string; total: number; available: number; booked: number; reserved: number }[]
}
