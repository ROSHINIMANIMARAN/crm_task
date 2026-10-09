import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, ChevronRight, Grid3x3, List, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { buildingsService, projectsService, unitsService } from '../services/projects'
import { formatCurrency, PROJECT_STATUS_COLORS, PROPERTY_TYPE_LABELS, UNIT_STATUS_COLORS } from '../utils/formatters'
import { PageSkeleton } from '../components/ui/Skeletons'
import { EmptyState } from '../components/ui/EmptyState'
import type { Project, PropertyType } from '../types'

type PropertyForm = 'project' | 'building' | 'unit' | null

export function PropertiesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [form, setForm] = useState<PropertyForm>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: projectsService.getProjects })
  const projects = projectsQuery.data ?? []
  const activeProject = projects.find((project) => project.id === selectedProjectId)
  const activeBuilding = activeProject?.buildings?.find((building) => building.id === selectedBuildingId)
  const unitsQuery = useQuery({
    queryKey: ['units', selectedBuildingId],
    queryFn: () => unitsService.getUnits({ buildingId: selectedBuildingId ?? undefined }),
    enabled: !!selectedBuildingId,
  })

  const refreshProperties = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
    await queryClient.invalidateQueries({ queryKey: ['units'] })
  }

  const createProject = useMutation({
    mutationFn: (input: Pick<Project, 'name' | 'location' | 'status'>) => projectsService.createProject(input),
    onSuccess: async (project) => {
      await refreshProperties()
      setSelectedProjectId(project.id)
      setForm(null)
      toast.success('Project saved')
    },
    onError: () => toast.error('Could not save project'),
  })
  const createBuilding = useMutation({
    mutationFn: (input: { projectId: string; name: string; floors: number }) => buildingsService.createBuilding(input),
    onSuccess: async (building) => {
      await refreshProperties()
      setSelectedBuildingId(building.id)
      setForm(null)
      toast.success('Building saved')
    },
    onError: () => toast.error('Could not save building'),
  })
  const createUnit = useMutation({
    mutationFn: (input: { buildingId: string; unitNumber: string; type: PropertyType; floor: number; area: number; price: number }) => unitsService.createUnit(input),
    onSuccess: async () => {
      await refreshProperties()
      setForm(null)
      toast.success('Unit saved as available')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not save unit'),
  })

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    if (form === 'project') {
      createProject.mutate({
        name: String(values.get('name')).trim(),
        location: String(values.get('location')).trim(),
        status: String(values.get('status')) as Project['status'],
      })
    } else if (form === 'building' && activeProject) {
      createBuilding.mutate({
        projectId: activeProject.id,
        name: String(values.get('name')).trim(),
        floors: Number(values.get('floors')),
      })
    } else if (form === 'unit' && activeBuilding) {
      createUnit.mutate({
        buildingId: activeBuilding.id,
        unitNumber: String(values.get('unitNumber')).trim(),
        type: String(values.get('type')) as PropertyType,
        floor: Number(values.get('floor')),
        area: Number(values.get('area')),
        price: Number(values.get('price')),
      })
    }
  }

  if (projectsQuery.isLoading) return <PageSkeleton />
  if (projectsQuery.isError) {
    return <div className="p-6 text-sm text-red-700">Property records could not be loaded. Refresh the page and try again.</div>
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto lg:flex-row lg:overflow-hidden">
      <aside className="w-full shrink-0 border-b border-gray-100 bg-white lg:w-64 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <div>
            <h1 className="text-sm font-bold text-gray-900">Properties</h1>
            <p className="mt-0.5 text-xs text-gray-500">{projects.length} saved projects</p>
          </div>
          {isAdmin && <button aria-label="Add project" title="Add project" onClick={() => setForm('project')} className="rounded-lg bg-[#01a0e2] p-2 text-white hover:bg-[#008bc9]"><Plus className="h-4 w-4" /></button>}
        </div>
        <div className="space-y-1 p-2">
          {projects.map((project) => (
            <div key={project.id}>
              <button onClick={() => { setSelectedProjectId(project.id); setSelectedBuildingId(null) }} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left ${selectedProjectId === project.id ? 'bg-sky-50 text-sky-800' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{project.name}</span><span className="block truncate text-[10px] text-gray-500">{project.location}</span></span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              {selectedProjectId === project.id && project.buildings?.map((building) => (
                <button key={building.id} onClick={() => setSelectedBuildingId(building.id)} className={`ml-7 mt-1 block w-[calc(100%-1.75rem)] rounded-lg px-3 py-2 text-left text-xs ${selectedBuildingId === building.id ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {building.name} <span className="text-gray-400">({building.units?.length ?? 0})</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
        {activeProject ? (
          <div className="mx-auto max-w-6xl space-y-5">
            <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{activeProject.name}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${PROJECT_STATUS_COLORS[activeProject.status]}`}>{activeProject.status}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{activeProject.location}</p>
              </div>
              {isAdmin && <button onClick={() => setForm(activeBuilding ? 'unit' : 'building')} className="flex items-center gap-2 rounded-xl bg-[#01a0e2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#008bc9]"><Plus className="h-4 w-4" />{activeBuilding ? 'Add unit' : 'Add building'}</button>}
            </header>

            {activeBuilding ? (
              <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
                  <div><h3 className="text-sm font-bold text-gray-900">{activeBuilding.name}</h3><p className="mt-1 text-xs text-gray-500">{activeBuilding.floors} floors · {unitsQuery.data?.length ?? 0} saved units</p></div>
                  <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
                    <button onClick={() => setView('grid')} className={`rounded-md p-2 ${view === 'grid' ? 'bg-gray-100' : ''}`} aria-label="Grid view"><Grid3x3 className="h-4 w-4" /></button>
                    <button onClick={() => setView('list')} className={`rounded-md p-2 ${view === 'list' ? 'bg-gray-100' : ''}`} aria-label="List view"><List className="h-4 w-4" /></button>
                  </div>
                </div>
                {unitsQuery.isLoading ? <p className="p-8 text-center text-sm text-gray-500">Loading saved units…</p> : unitsQuery.isError ? <p className="p-8 text-center text-sm text-red-600">Units could not be loaded.</p> : unitsQuery.data?.length ? (
                  view === 'grid' ? <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">{unitsQuery.data.map((unit) => <div key={unit.id} className={`rounded-xl border p-3 ${UNIT_STATUS_COLORS[unit.status]}`}><p className="font-bold">{unit.unitNumber}</p><p className="mt-1 text-[10px]">{PROPERTY_TYPE_LABELS[unit.type]} · Floor {unit.floor}</p><p className="mt-1 text-[10px] font-semibold">{formatCurrency(unit.price)}</p><p className="mt-1 text-[10px]">{unit.status}</p></div>)}</div> :
                    <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-gray-50 text-[11px] uppercase text-gray-500"><tr>{['Unit', 'Type', 'Floor', 'Area', 'Price', 'Availability'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{unitsQuery.data.map((unit) => <tr key={unit.id}><td className="px-4 py-3 font-mono text-xs">{unit.unitNumber}</td><td className="px-4 py-3 text-xs">{PROPERTY_TYPE_LABELS[unit.type]}</td><td className="px-4 py-3 text-xs">{unit.floor}</td><td className="px-4 py-3 text-xs">{unit.area.toLocaleString()} sqft</td><td className="px-4 py-3 text-xs font-semibold">{formatCurrency(unit.price)}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${UNIT_STATUS_COLORS[unit.status]}`}>{unit.status}</span></td></tr>)}</tbody></table></div>
                ) : <EmptyState icon={Building2} title="No unit records" description="No units have been added to this building yet." action={isAdmin ? { label: 'Add unit', onClick: () => setForm('unit') } : undefined} />}
              </section>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: 'Buildings', value: String(activeProject.buildings?.length ?? 0) },
                  { label: 'Units', value: String(activeProject.totalUnits ?? 0) },
                  { label: 'Available units', value: String(activeProject.availableUnits ?? 0) },
                ].map((stat) => <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-xs text-gray-500">{stat.label}</p><p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p></div>)}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-3">
                  <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-gray-900">Buildings</h3>{isAdmin && <button onClick={() => setForm('building')} className="text-xs font-semibold text-sky-800">Add building</button>}</div>
                  {activeProject.buildings?.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{activeProject.buildings.map((building) => <button key={building.id} onClick={() => setSelectedBuildingId(building.id)} className="rounded-xl border border-gray-100 p-4 text-left hover:border-sky-200 hover:bg-sky-50/40"><p className="text-sm font-semibold text-gray-900">{building.name}</p><p className="mt-1 text-xs text-gray-500">{building.floors} floors · {building.units?.length ?? 0} units</p></button>)}</div> : <p className="py-6 text-center text-sm text-gray-500">No building records for this project yet.</p>}
                </section>
              </div>
            )}
          </div>
        ) : projects.length ? (
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Saved projects</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{projects.map((project) => <button key={project.id} onClick={() => setSelectedProjectId(project.id)} className="rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm hover:border-sky-200"><h3 className="text-sm font-bold text-gray-900">{project.name}</h3><p className="mt-1 text-xs text-gray-500">{project.location}</p><div className="mt-4 flex justify-between text-xs text-gray-500"><span>{project.buildings?.length ?? 0} buildings</span><span>{project.totalUnits ?? 0} units</span></div></button>)}</div>
          </div>
        ) : <div className="flex h-full min-h-64 items-center justify-center"><EmptyState icon={Building2} title="No saved property records" description={isAdmin ? 'Add a project to start recording buildings and available units. No sample inventory is shown.' : 'There are no property records available to your team yet.'} action={isAdmin ? { label: 'Add project', onClick: () => setForm('project') } : undefined} /></div>}
      </main>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null) }}>
          <form onSubmit={onSubmit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between"><h2 className="text-base font-bold text-gray-900">{form === 'project' ? 'Add project' : form === 'building' ? 'Add building' : 'Add unit'}</h2><button type="button" onClick={() => setForm(null)} className="text-sm text-gray-500">Close</button></div>
            {form === 'project' && <>
              <label className="block text-xs font-medium text-gray-600">Project name<input name="name" required maxLength={100} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label>
              <label className="block text-xs font-medium text-gray-600">Location<input name="location" required maxLength={120} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label>
              <label className="block text-xs font-medium text-gray-600">Status<select name="status" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"><option value="ACTIVE">Active</option><option value="UPCOMING">Upcoming</option><option value="READY">Ready</option></select></label>
            </>}
            {form === 'building' && <>
              <label className="block text-xs font-medium text-gray-600">Building name<input name="name" required maxLength={100} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label>
              <label className="block text-xs font-medium text-gray-600">Number of floors<input name="floors" type="number" required min="1" max="200" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label>
            </>}
            {form === 'unit' && <>
              <label className="block text-xs font-medium text-gray-600">Unit number<input name="unitNumber" required maxLength={30} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label>
              <label className="block text-xs font-medium text-gray-600">Property type<select name="type" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">{Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-medium text-gray-600">Floor<input name="floor" type="number" required min="0" max={activeBuilding?.floors ?? 200} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label>
                <label className="text-xs font-medium text-gray-600">Area (sqft)<input name="area" type="number" required min="1" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label>
                <label className="text-xs font-medium text-gray-600">Price (₹)<input name="price" type="number" required min="1" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label>
              </div>
            </>}
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setForm(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600">Cancel</button><button disabled={createProject.isPending || createBuilding.isPending || createUnit.isPending} className="rounded-xl bg-[#01a0e2] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save</button></div>
          </form>
        </div>
      )}
    </div>
  )
}
