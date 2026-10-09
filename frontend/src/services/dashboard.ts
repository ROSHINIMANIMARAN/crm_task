import { api } from '../lib/api'
import type { DashboardData } from '../types'

export const dashboardService = {
  getStats: async () => { const { data } = await api.get('/dashboard/stats'); return data as DashboardData },
}
