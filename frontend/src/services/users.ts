import { api } from '../lib/api'
import type { User } from '../types'

export const usersService = {
  getUsers: async () => { const { data } = await api.get('/users'); return data.users as User[] },
  getSalesUsers: async () => { const { data } = await api.get('/users/sales'); return data.users as User[] },
  createUser: async (u: { name: string; email: string; password: string; role: string; designation?: string; phone?: string }) => {
    const { data } = await api.post('/users', u); return data.user as User
  },
  updateUser: async (id: string, u: Partial<User>) => { const { data } = await api.patch(`/users/${id}`, u); return data.user as User },
  deleteUser: async (id: string) => { await api.delete(`/users/${id}`) },
}
