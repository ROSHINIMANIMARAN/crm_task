import type { Booking, BookingStatus, Building, Project, Unit } from '../types'
import { getDemoBookings, getDemoLeads, getDemoProjects, getDemoUsers, saveDemoBookings, saveDemoLeads, saveDemoProjects } from './demoStore'
import { notificationsService } from './notifications'

export interface CreateBookingData {
  leadId: string; unitId: string; bookingAmount: number
  paymentMethod: string; bankUtr?: string; bankName?: string
  notes?: string; bookingDate?: string
}

export const bookingsService = {
  getBookings: async (params?: { search?: string; status?: string; page?: number; limit?: number; projectId?: string; assignedTo?: string }) => {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 20
    const search = params?.search?.toLowerCase()
    const filtered = getDemoBookings()
      .filter((booking) => !params?.status || booking.status === params.status)
      .filter((booking) => !params?.projectId || booking.projectId === params.projectId)
      .filter((booking) => !params?.assignedTo || booking.salesEmployeeId === params.assignedTo)
      .filter((booking) => !search || [booking.bookingNumber, booking.lead?.name, booking.unit?.unitNumber].some((value) => value?.toLowerCase().includes(search)))
    return { bookings: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, totalPages: Math.ceil(filtered.length / limit) }
  },
  getBooking: async (id: string) => {
    const booking = getDemoBookings().find((item) => item.id === id)
    if (!booking) throw new Error('Booking not found')
    return booking
  },
  createBooking: async (input: CreateBookingData) => {
    const leads = getDemoLeads()
    const lead = leads.find((item) => item.id === input.leadId)
    if (!lead || lead.stage === 'LOST' || lead.stage === 'BOOKED') throw new Error('Select an eligible lead before booking')
    const projects = getDemoProjects()
    let selectedProject: Project | undefined
    let selectedUnit: Unit | undefined
    let selectedBuilding: Building | undefined
    for (const project of projects) {
      for (const building of project.buildings ?? []) {
        const unit = building.units?.find((item) => item.id === input.unitId)
        if (unit) {
          selectedProject = project
          selectedBuilding = building
          selectedUnit = unit
          break
        }
      }
      if (selectedUnit) break
    }
    if (!selectedProject || !selectedBuilding || !selectedUnit || selectedUnit.status !== 'AVAILABLE') {
      throw new Error('Unit is no longer available. Choose another unit.')
    }
    const now = new Date().toISOString()
    const currentUser = getDemoUsers().find((user) => user.role === 'SALES_EMPLOYEE')
    const booking: Booking = {
      id: `demo-booking-${crypto.randomUUID()}`,
      bookingNumber: `BK-${String(getDemoBookings().length + 1).padStart(4, '0')}`,
      leadId: lead.id,
      lead,
      unitId: selectedUnit.id,
      unit: selectedUnit,
      projectId: selectedProject.id,
      project: { id: selectedProject.id, name: selectedProject.name, location: selectedProject.location },
      salesEmployeeId: lead.assignedToId ?? currentUser?.id ?? 'demo-sales',
      salesEmployee: { id: currentUser?.id ?? 'demo-sales', name: lead.assignedTo?.name ?? currentUser?.name ?? 'Sales employee' },
      bookingAmount: input.bookingAmount,
      totalPrice: selectedUnit.price + selectedUnit.floorRisePremium + (selectedUnit.parkingPrice ?? 0),
      paymentMethod: input.paymentMethod,
      bankUtr: input.bankUtr,
      bankName: input.bankName,
      bookingDate: input.bookingDate ?? now,
      status: 'PENDING',
      notes: input.notes,
      createdAt: now,
    }
    selectedUnit.status = 'BOOKED'
    selectedBuilding.totalUnits = selectedBuilding.units?.length ?? 0
    selectedProject.availableUnits = Math.max(0, (selectedProject.availableUnits ?? 0) - 1)
    selectedProject.bookedUnits = (selectedProject.bookedUnits ?? 0) + 1
    const leadIndex = leads.findIndex((item) => item.id === lead.id)
    leads[leadIndex] = { ...lead, stage: 'BOOKED', updatedAt: now }
    saveDemoProjects(projects)
    saveDemoLeads(leads)
    saveDemoBookings([booking, ...getDemoBookings()])
    notificationsService.create({
      kind: 'booking',
      title: 'New booking created',
      description: `${lead.name} · ${selectedProject.name} · Unit ${selectedUnit.unitNumber}`,
      href: '/bookings',
    })
    return booking
  },
  updateBooking: async (id: string, payload: { status?: string; notes?: string }) => {
    const bookings = getDemoBookings()
    const index = bookings.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Booking not found')
    bookings[index] = { ...bookings[index], ...payload, status: (payload.status ?? bookings[index].status) as BookingStatus }
    saveDemoBookings(bookings)
    return bookings[index]
  },
}
