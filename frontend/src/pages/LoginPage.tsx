import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Moon, Sun } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type Form = z.infer<typeof schema>

const PROXIMITY_RADIUS = 130
const WATERMARK_OPACITY = 0.2

const demoAccounts = [
  { role: 'Admin', email: 'admin@estateflow.com', password: 'Admin@123' },
  { role: 'Sales employee', email: 'sales1@estateflow.com', password: 'Sales@123' },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const interactionAreaRef = useRef<HTMLElement>(null)
  const loginCardRef = useRef<HTMLElement>(null)
  const watermarkGridRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [showPwd, setShowPwd] = useState(false)
  const { darkMode, setDarkMode } = useTheme()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    }
  }

  useEffect(() => {
    const interactionArea = interactionAreaRef.current
    const loginCard = loginCardRef.current
    const watermarkGrid = watermarkGridRef.current
    const glow = glowRef.current
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (!interactionArea || !loginCard || !watermarkGrid || !glow || !supportsHover.matches || reducedMotion.matches) {
      return
    }

    let logos: Array<{ element: HTMLImageElement; x: number; y: number }> = []
    let target: { x: number; y: number } | null = null
    let currentX = 0
    let currentY = 0
    let animationFrame: number | null = null
    let activeLogos = new Set<HTMLImageElement>()

    const isInsideLoginCard = (x: number, y: number) => {
      const bounds = loginCard.getBoundingClientRect()
      return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom
    }

    const measureLogos = () => {
      logos = Array.from(watermarkGrid.querySelectorAll<HTMLImageElement>('.login-watermark-logo'))
        .map((element) => {
          const bounds = element.getBoundingClientRect()
          return {
            element,
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
          }
        })
        .filter(({ x, y }) => !isInsideLoginCard(x, y))
    }

    const resetEffect = () => {
      target = null
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
      animationFrame = null
      for (const logo of activeLogos) {
        logo.style.removeProperty('opacity')
        logo.style.removeProperty('transform')
        logo.style.removeProperty('filter')
      }
      activeLogos.clear()
      glow.style.opacity = '0'
    }

    const animate = () => {
      animationFrame = null
      if (!target) return

      currentX += (target.x - currentX) * 0.22
      currentY += (target.y - currentY) * 0.22

      if (Math.abs(target.x - currentX) < 0.5 && Math.abs(target.y - currentY) < 0.5) {
        currentX = target.x
        currentY = target.y
      }

      const nextActiveLogos = new Set<HTMLImageElement>()
      for (const logo of logos) {
        const distance = Math.hypot(logo.x - currentX, logo.y - currentY)
        const proximity = Math.max(0, 1 - distance / PROXIMITY_RADIUS) ** 1.5
        if (proximity === 0) {
          if (activeLogos.has(logo.element)) {
            logo.element.style.removeProperty('opacity')
            logo.element.style.removeProperty('transform')
            logo.element.style.removeProperty('filter')
          }
          continue
        }

        logo.element.style.opacity = String(WATERMARK_OPACITY + proximity * (1 - WATERMARK_OPACITY))
        logo.element.style.transform = `scale(${1 + proximity * 0.08})`
        logo.element.style.filter = `brightness(${1 - proximity * 0.1}) saturate(${1 + proximity * 0.05})`
        nextActiveLogos.add(logo.element)
      }
      activeLogos = nextActiveLogos

      glow.style.left = `${currentX}px`
      glow.style.top = `${currentY}px`
      glow.style.opacity = '1'

      if (currentX !== target.x || currentY !== target.y) {
        animationFrame = window.requestAnimationFrame(animate)
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if (isInsideLoginCard(event.clientX, event.clientY)) {
        resetEffect()
        return
      }
      target = { x: event.clientX, y: event.clientY }
      if (animationFrame === null) animationFrame = window.requestAnimationFrame(animate)
    }

    const handlePointerLeave = () => {
      resetEffect()
    }

    measureLogos()
    interactionArea.addEventListener('pointermove', handlePointerMove)
    interactionArea.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('resize', measureLogos)

    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
      interactionArea.removeEventListener('pointermove', handlePointerMove)
      interactionArea.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('resize', measureLogos)
    }
  }, [])

  return (
    <main ref={interactionAreaRef} className="fixed inset-0 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-[#f5f7f8] p-3 sm:p-5">
      <button
        type="button"
        aria-label={darkMode ? 'Switch to light theme' : 'Switch to night theme'}
        title={darkMode ? 'Switch to light theme' : 'Switch to night theme'}
        onClick={() => setDarkMode((current) => !current)}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-sky-100/60 blur-3xl" />
        <div ref={glowRef} className="login-watermark-glow" />
        <div
          ref={watermarkGridRef}
          className="login-watermark-grid"
          style={{
            position: 'absolute',
            inset: '-35%',
            transform: 'rotate(-28deg) scale(1.15)',
            gridTemplateColumns: 'repeat(50, 50px)',
            gridTemplateRows: 'repeat(40, 40px)',
          }}
        >
          {Array.from({ length: 2000 }, (_, index) => (
            <img key={index} src="/manju-groups-mark.svg" alt="" className="login-watermark-logo" />
          ))}
        </div>
      </div>

      <section ref={loginCardRef} className="login-card relative z-10 w-full max-w-sm rounded-2xl border border-white px-5 py-5 shadow-[0_20px_60px_-28px_rgba(31,50,58,0.3)] sm:px-7 sm:py-6">
        <header className="mb-4 flex flex-col items-center text-center">
          <div className="relative h-16 w-28 overflow-hidden" aria-label="Manju Groups logo">
            <img
              src="/manju-groups-mark.svg"
              alt="Manju Groups logo"
              className="absolute left-1/2 top-1/2 h-[176px] w-[220px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            />
          </div>
          <p className="mt-1 text-[12px] font-black tracking-[0.14em] text-[#34413d]">MANJU GROUPS</p>
          <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#82908a]">Real Estate CRM</p>
        </header>

        <div className="mb-4 text-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Welcome back</h1>
          <p className="mt-1 text-xs text-gray-500">Sign in to continue to your workspace.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-xs font-medium text-gray-700">Email address</label>
            <input
              {...register('email')}
              id="login-email"
              type="email"
              placeholder="admin@estateflow.com"
              autoComplete="username"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm transition focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
            />
            {errors.email && <p role="alert" className="mt-1 text-[11px] text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-xs font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 pr-10 text-sm transition focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
              />
              <button
                type="button"
                onClick={() => setShowPwd((visible) => !visible)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-600/30"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p role="alert" className="mt-1 text-[11px] text-red-600">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: '#01a0e2' }}
            className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-700 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">Quick sign-in accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <div key={account.role} className="min-w-0 rounded-lg bg-gray-50 px-2.5 py-2">
                <p className="text-[10px] font-semibold text-gray-700">{account.role}</p>
                <p className="mt-1 truncate font-mono text-[9px] text-gray-600">{account.email}</p>
                <p className="mt-0.5 font-mono text-[9px] text-gray-500">{account.password}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
