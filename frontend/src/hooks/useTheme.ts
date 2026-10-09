import { useEffect, useState } from 'react'

export function useTheme() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('manju-theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('manju-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return { darkMode, setDarkMode }
}
