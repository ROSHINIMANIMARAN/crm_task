import { createContext, createElement, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Role, User } from '../types'
import { getDemoUsers, saveDemoUsers } from '../services/demoStore'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  updateProfile: (profile: UserProfile) => void
}

export type UserProfile = Pick<User, 'name' | 'phone' | 'designation' | 'department' | 'location' | 'bio'>

const AuthContext = createContext<AuthState | null>(null)

const demoAccounts: Record<string, { password: string; role: Role; name: string; designation: string }> = {
  'admin@estateflow.com': {
    password: 'Admin@123',
    role: 'ADMIN',
    name: 'Roshini',
    designation: 'Sales Lead / Admin',
  },
  'sales1@estateflow.com': {
    password: 'Sales@123',
    role: 'SALES_EMPLOYEE',
    name: 'Roshini',
    designation: 'Senior Advisor',
  },
}

function profileNameKey(email: string): string {
  return `ef_profile_customized:${email}`
}

function profileDataKey(email: string): string {
  return `ef_profile:${email}`
}

function getSavedProfile(email: string): Partial<UserProfile> {
  const serialized = localStorage.getItem(profileDataKey(email))
  if (serialized) {
    try {
      const profile: unknown = JSON.parse(serialized)
      if (typeof profile === 'object' && profile !== null) return profile as Partial<UserProfile>
      throw new Error('Saved profile data is not an object')
    } catch (error) {
      if (error instanceof SyntaxError) {
        localStorage.removeItem(profileDataKey(email))
        return {}
      }
      throw error
    }
  }
  return {}
}

function getStoredUser(): User | null {
  const userData = localStorage.getItem('ef_user')
  if (!userData) {
    localStorage.removeItem('ef_auth_provider')
    return null
  }

  try {
    const storedUser = JSON.parse(userData) as User
    localStorage.removeItem('ef_auth_provider')
    const account = demoAccounts[storedUser.email]
    if (!account) {
      localStorage.removeItem('ef_token')
      localStorage.removeItem('ef_user')
      return null
    }
    const profile = getSavedProfile(storedUser.email)
    return {
      ...storedUser,
      id: account.role === 'ADMIN' ? 'demo-admin' : 'demo-sales',
      role: account.role,
      ...profile,
      name: profile.name ??
        (localStorage.getItem(profileNameKey(storedUser.email)) === 'true' &&
          typeof storedUser.name === 'string' && storedUser.name.trim()
          ? storedUser.name
          : account.name),
      designation: profile.designation ?? account.designation,
      email: storedUser.email,
    }
  } catch {
    localStorage.removeItem('ef_user')
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const isLoading = false

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const account = demoAccounts[normalizedEmail]

    if (!account || account.password !== password) {
      throw new Error('Invalid email or password')
    }

    const storedUser = getStoredUser()
    const profile = getSavedProfile(normalizedEmail)
    const savedDemoUser = getDemoUsers().find((item) => item.email === normalizedEmail)
    const signedInUser: User = {
      id: account.role === 'ADMIN' ? 'demo-admin' : 'demo-sales',
      ...savedDemoUser,
      ...profile,
      name: profile.name ??
        (localStorage.getItem(profileNameKey(normalizedEmail)) === 'true'
          ? savedDemoUser?.name ?? storedUser?.name ?? account.name
          : account.name),
      email: normalizedEmail,
      role: account.role,
      designation: profile.designation ?? savedDemoUser?.designation ?? account.designation,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    }

    localStorage.removeItem('ef_token')
    localStorage.removeItem('ef_auth_provider')
    localStorage.setItem('ef_user', JSON.stringify(signedInUser))
    setUser(signedInUser)
    return signedInUser
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ef_token')
    localStorage.removeItem('ef_user')
    localStorage.removeItem('ef_auth_provider')
    setUser(null)
    window.location.href = '/login'
  }, [])

  const updateProfile = useCallback((profile: UserProfile) => {
    const normalizedProfile: UserProfile = {
      name: profile.name.trim(),
      phone: profile.phone?.trim() ?? '',
      designation: profile.designation?.trim() ?? '',
      department: profile.department?.trim() ?? '',
      location: profile.location?.trim() ?? '',
      bio: profile.bio?.trim() ?? '',
    }
    if (!normalizedProfile.name) throw new Error('Name cannot be empty')
    setUser((currentUser) => {
      if (!currentUser) return currentUser
      const updatedUser = { ...currentUser, ...normalizedProfile }
      localStorage.setItem('ef_user', JSON.stringify(updatedUser))
      localStorage.setItem(profileNameKey(updatedUser.email), 'true')
      localStorage.setItem(profileDataKey(updatedUser.email), JSON.stringify(normalizedProfile))
      const users = getDemoUsers()
      const userIndex = users.findIndex((item) => item.id === updatedUser.id)
      if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...normalizedProfile }
        saveDemoUsers(users)
      }
      return updatedUser
    })
  }, [])

  return createElement(
    AuthContext.Provider,
    { value: { user, isAuthenticated: user !== null, isLoading, login, logout, updateProfile } },
    children,
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
