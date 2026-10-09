import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Database, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import type { UserProfile } from '../hooks/useAuth'

function getProfile(user: ReturnType<typeof useAuth>['user']): UserProfile {
  return {
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    designation: user?.designation ?? '',
    department: user?.department ?? '',
    location: user?.location ?? '',
    bio: user?.bio ?? '',
  }
}

export function SettingsPage() {
  const { user, updateProfile, logout } = useAuth()
  const queryClient = useQueryClient()
  const [profile, setProfile] = useState<UserProfile>(() => getProfile(user))
  const isAdmin = user?.role === 'ADMIN'
  const savedProfile = getProfile(user)
  const hasProfileChanges = Object.keys(savedProfile).some(
    (key) => savedProfile[key as keyof UserProfile] !== profile[key as keyof UserProfile],
  )

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile.name.trim()) {
      toast.error('Enter your full name')
      return
    }
    try {
      updateProfile(profile)
      void queryClient.invalidateQueries()
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update your profile')
    }
  }

  const setField = (field: keyof UserProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-xs text-gray-500">Manage your profile, account, and workspace preferences.</p>
        </header>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-sky-50 p-3 text-sky-800"><UserRound className="h-5 w-5" /></div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Your profile</h2>
              <p className="text-xs text-gray-500">Personal details are saved in this browser only.</p>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-gray-600">
                Full name
                <input
                  value={profile.name}
                  onChange={(event) => setField('name', event.target.value)}
                  required
                  maxLength={80}
                  autoComplete="name"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Email address
                <input
                  value={user?.email ?? ''}
                  readOnly
                  autoComplete="email"
                  className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Phone number
                <input
                  value={profile.phone ?? ''}
                  onChange={(event) => setField('phone', event.target.value)}
                  type="tel"
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="Add your phone number"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Job title
                <input
                  value={profile.designation ?? ''}
                  onChange={(event) => setField('designation', event.target.value)}
                  maxLength={80}
                  autoComplete="organization-title"
                  placeholder="e.g. Senior Sales Advisor"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Department
                <input
                  value={profile.department ?? ''}
                  onChange={(event) => setField('department', event.target.value)}
                  maxLength={80}
                  placeholder="e.g. Sales"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Work location
                <input
                  value={profile.location ?? ''}
                  onChange={(event) => setField('location', event.target.value)}
                  maxLength={120}
                  autoComplete="address-level2"
                  placeholder="City or office location"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                About
                <textarea
                  value={profile.bio ?? ''}
                  onChange={(event) => setField('bio', event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="A short introduction about your role"
                  className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">
                Account role: <span className="font-semibold text-gray-700">{isAdmin ? 'Administrator' : 'Sales employee'}</span>
              </p>
              <button
                type="submit"
                disabled={!hasProfileChanges}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#01a0e2] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> Save profile
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-800"><ShieldCheck className="h-5 w-5" /></div>
            <div><h2 className="text-sm font-bold text-gray-900">Role and permissions</h2><p className="text-xs text-gray-500">Permissions apply to this interface.</p></div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <article className={`rounded-xl border p-4 ${isAdmin ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-indigo-700" /><h3 className="text-sm font-semibold text-gray-900">Admin</h3>{isAdmin && <span className="ml-auto text-[10px] font-semibold text-indigo-700">CURRENT ROLE</span>}</div>
              <p className="mt-2 text-xs leading-5 text-gray-600">View all leads and reports, assign leads, delete leads, manage property inventory, and review the sales team.</p>
            </article>
            <article className={`rounded-xl border p-4 ${!isAdmin ? 'border-sky-200 bg-sky-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-sky-700" /><h3 className="text-sm font-semibold text-gray-900">Sales employee</h3>{!isAdmin && <span className="ml-auto text-[10px] font-semibold text-sky-700">CURRENT ROLE</span>}</div>
              <p className="mt-2 text-xs leading-5 text-gray-600">View and update assigned leads, add follow-ups, view property inventory, and see reports for assigned records. Team administration is not available.</p>
            </article>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-amber-800">Role checks in this interface are for usability only; they are not a substitute for backend authorization.</p>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-3 text-red-700"><LogOut className="h-5 w-5" /></div>
            <div><h2 className="text-sm font-bold text-gray-900">Sign out</h2><p className="text-xs text-gray-500">Sign out of this browser session.</p></div>
          </div>
          <button onClick={logout} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50">
            Sign out
          </button>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-sky-50 p-3 text-sky-800"><Database className="h-5 w-5" /></div><div><h2 className="text-sm font-bold text-gray-900">Data and organization</h2><p className="text-xs text-gray-500">Manju Groups CRM · Browser-only storage</p></div></div>
          <p className="mt-3 text-xs leading-5 text-gray-600">Lead, follow-up, property, and booking changes are stored in this browser only. They are not shared with other browsers or devices, and there is no live API or database connection.</p>
        </section>
      </div>
    </div>
  )
}
