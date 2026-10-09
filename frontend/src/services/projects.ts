import type { Project, Building, Unit } from '../types'
import { createDemoBuilding, createDemoProject, createDemoUnit, getDemoProjects, saveDemoProjects } from './demoStore'

export const projectsService = {
  getProjects: async () => getDemoProjects(),
  getProject: async (id: string) => {
    const project = getDemoProjects().find((item) => item.id === id)
    if (!project) throw new Error('Project not found')
    return project
  },
  createProject: async (p: Pick<Project, 'name' | 'location' | 'status'>) => createDemoProject(p),
  updateProject: async (id: string, updates: Partial<Project>) => {
    const projects = getDemoProjects()
    const index = projects.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Project not found')
    projects[index] = { ...projects[index], ...updates }
    saveDemoProjects(projects)
    return projects[index]
  },
  deleteProject: async (id: string) => {
    saveDemoProjects(getDemoProjects().filter((project) => project.id !== id))
  },
}

export const buildingsService = {
  getBuildings: async (projectId?: string) => {
    return getDemoProjects().flatMap((project) => projectId && project.id !== projectId ? [] : project.buildings ?? [])
  },
  createBuilding: async (building: Pick<Building, 'projectId' | 'name' | 'floors'>) => createDemoBuilding(building.projectId, building),
  updateBuilding: async (id: string, updates: Partial<Building>) => {
    const projects = getDemoProjects()
    const building = projects.flatMap((project) => project.buildings ?? []).find((item) => item.id === id)
    if (!building) throw new Error('Building not found')
    Object.assign(building, updates)
    saveDemoProjects(projects)
    return building
  },
}

export const unitsService = {
  getUnits: async (params?: { buildingId?: string; projectId?: string; status?: string; type?: string; minPrice?: number; maxPrice?: number }) => {
    return getDemoProjects()
      .filter((project) => !params?.projectId || project.id === params.projectId)
      .flatMap((project) => project.buildings ?? [])
      .filter((building) => !params?.buildingId || building.id === params.buildingId)
      .flatMap((building) => building.units ?? [])
      .filter((unit) => !params?.status || unit.status === params.status)
      .filter((unit) => !params?.type || unit.type === params.type)
      .filter((unit) => params?.minPrice === undefined || unit.price >= params.minPrice)
      .filter((unit) => params?.maxPrice === undefined || unit.price <= params.maxPrice)
  },
  getUnit: async (id: string) => {
    const unit = getDemoProjects().flatMap((project) => project.buildings ?? []).flatMap((building) => building.units ?? []).find((item) => item.id === id)
    if (!unit) throw new Error('Unit not found')
    return unit
  },
  createUnit: async (u: Pick<Unit, 'buildingId' | 'unitNumber' | 'type' | 'floor' | 'area' | 'price'>) => createDemoUnit(u.buildingId, u),
  updateUnit: async (id: string, updates: Partial<Unit>) => {
    const projects = getDemoProjects()
    const unit = projects.flatMap((project) => project.buildings ?? []).flatMap((building) => building.units ?? []).find((item) => item.id === id)
    if (!unit) throw new Error('Unit not found')
    Object.assign(unit, updates)
    saveDemoProjects(projects)
    return unit
  },
}
