import { useLayoutEffect, useState } from 'react'

export type Theme = {
  id: string
  name: string
  scheme: 'dark' | 'light'
  bg: string
  surface: string
  surface2: string
  border: string
  text: string
  muted: string
  accent: string
  /** Chrono en cours, loin du record */
  ok: string
  /** Chrono à moins de WARN_MS du record */
  warn: string
  /** Record dépassé */
  over: string
}

export const THEMES: Theme[] = [
  {
    id: 'nuit', name: 'Nuit', scheme: 'dark',
    bg: '#0e0f13', surface: '#16181e', surface2: '#1d2028', border: '#262a33',
    text: '#e8eaf0', muted: '#8a90a0', accent: '#4ade80',
    ok: '#4ade80', warn: '#fbbf24', over: '#f87171',
  },
  {
    id: 'ocean', name: 'Océan', scheme: 'dark',
    bg: '#0b1420', surface: '#111d2d', surface2: '#172638', border: '#22344a',
    text: '#e3edf7', muted: '#7f93ab', accent: '#38bdf8',
    ok: '#5eead4', warn: '#fcd34d', over: '#fb7185',
  },
  {
    id: 'foret', name: 'Forêt', scheme: 'dark',
    bg: '#0f1510', surface: '#151d16', surface2: '#1b261d', border: '#26352a',
    text: '#e6efe4', muted: '#8a9c88', accent: '#a3e635',
    ok: '#86efac', warn: '#facc15', over: '#f87171',
  },
  {
    id: 'nord', name: 'Nord', scheme: 'dark',
    bg: '#242933', surface: '#2e3440', surface2: '#3b4252', border: '#434c5e',
    text: '#eceff4', muted: '#9aa5b8', accent: '#88c0d0',
    ok: '#a3be8c', warn: '#ebcb8b', over: '#bf616a',
  },
  {
    id: 'dracula', name: 'Dracula', scheme: 'dark',
    bg: '#1e1f29', surface: '#282a36', surface2: '#313442', border: '#44475a',
    text: '#f8f8f2', muted: '#8f98c4', accent: '#bd93f9',
    ok: '#50fa7b', warn: '#ffb86c', over: '#ff5555',
  },
  {
    id: 'monokai', name: 'Monokai', scheme: 'dark',
    bg: '#1f201b', surface: '#272822', surface2: '#31322b', border: '#49483e',
    text: '#f8f8f2', muted: '#a59f85', accent: '#66d9ef',
    ok: '#a6e22e', warn: '#fd971f', over: '#f92672',
  },
  {
    id: 'synthwave', name: 'Synthwave', scheme: 'dark',
    bg: '#140d23', surface: '#1c1233', surface2: '#251842', border: '#36245c',
    text: '#f5e9ff', muted: '#a58fc7', accent: '#ff4fd8',
    ok: '#2de2e6', warn: '#ffd319', over: '#ff3864',
  },
  {
    id: 'sakura', name: 'Sakura', scheme: 'dark',
    bg: '#1a1216', surface: '#231920', surface2: '#2d2029', border: '#3d2c38',
    text: '#fbeef3', muted: '#b095a4', accent: '#f9a8d4',
    ok: '#a7f3d0', warn: '#fde68a', over: '#fb7185',
  },
  {
    id: 'solarized', name: 'Solarized', scheme: 'light',
    bg: '#fdf6e3', surface: '#eee8d5', surface2: '#e6dfc8', border: '#d6ceb5',
    text: '#073642', muted: '#657b83', accent: '#268bd2',
    ok: '#859900', warn: '#b58900', over: '#dc322f',
  },
  {
    id: 'latte', name: 'Latte', scheme: 'light',
    bg: '#eff1f5', surface: '#e6e9ef', surface2: '#dce0e8', border: '#ccd0da',
    text: '#4c4f69', muted: '#6c6f85', accent: '#8839ef',
    ok: '#40a02b', warn: '#df8e1d', over: '#d20f39',
  },
  {
    id: 'papier', name: 'Papier', scheme: 'light',
    bg: '#f7f7f5', surface: '#ffffff', surface2: '#efefec', border: '#e0e0dc',
    text: '#1c1c1e', muted: '#6b6b70', accent: '#2563eb',
    ok: '#16a34a', warn: '#d97706', over: '#dc2626',
  },
]

const THEME_KEY = 'chrono.theme'

function loadTheme(): Theme {
  try {
    const id = localStorage.getItem(THEME_KEY)
    const found = THEMES.find((t) => t.id === id)
    if (found) return found
  } catch {
    // ignore
  }
  return THEMES[0]
}

function applyTheme(theme: Theme) {
  const root = document.documentElement.style
  root.setProperty('--bg', theme.bg)
  root.setProperty('--surface', theme.surface)
  root.setProperty('--surface-2', theme.surface2)
  root.setProperty('--border', theme.border)
  root.setProperty('--text', theme.text)
  root.setProperty('--muted', theme.muted)
  root.setProperty('--accent', theme.accent)
  root.setProperty('--timer-ok', theme.ok)
  root.setProperty('--timer-warn', theme.warn)
  root.setProperty('--timer-over', theme.over)
  root.setProperty('color-scheme', theme.scheme)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg)
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(loadTheme)

  // Layout effect : appliqué avant le premier paint, pas de flash du thème par défaut
  useLayoutEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_KEY, theme.id)
    } catch {
      // ignore
    }
  }, [theme])

  return { theme, setTheme }
}
