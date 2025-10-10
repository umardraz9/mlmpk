'use client'

// Minimal, dependency-free toast utility compatible with shadcn-style API
// Exposes useToast() returning { toast }.
// Renders lightweight toasts to a fixed container in the document body.

export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info'

export type ToastOptions = {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number // ms
}

const DEFAULT_DURATION = 3500
const CONTAINER_ID = 'mlmpak-toast-root'

function ensureContainer(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  let el = document.getElementById(CONTAINER_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = CONTAINER_ID
    el.style.position = 'fixed'
    el.style.right = '16px'
    el.style.bottom = '16px'
    el.style.zIndex = '9999'
    el.style.display = 'flex'
    el.style.flexDirection = 'column'
    el.style.gap = '8px'
    el.style.pointerEvents = 'none'
    document.body.appendChild(el)
  }
  return el
}

function variantClasses(variant: ToastVariant = 'default') {
  // These class names are kept literal so Tailwind can include them.
  switch (variant) {
    case 'destructive':
      return 'bg-red-600 text-white border border-red-700 shadow-lg'
    case 'success':
      return 'bg-emerald-600 text-white border border-emerald-700 shadow-lg'
    case 'warning':
      return 'bg-yellow-600 text-white border border-yellow-700 shadow-lg'
    case 'info':
      return 'bg-blue-600 text-white border border-blue-700 shadow-lg'
    default:
      return 'bg-gray-900 text-white border border-gray-800 shadow-lg'
  }
}

export function toast(opts: ToastOptions) {
  if (typeof window === 'undefined') {
    // SSR / no-op
    return
  }

  const { title, description, variant = 'default', duration = DEFAULT_DURATION } = opts || {}

  const container = ensureContainer()
  if (!container) return

  const item = document.createElement('div')
  item.className = [
    'pointer-events-auto max-w-sm rounded-lg px-4 py-3 transition-all duration-300',
    'backdrop-blur-sm',
    variantClasses(variant),
  ].join(' ')

  const titleEl = document.createElement('div')
  if (title) {
    titleEl.textContent = title
    titleEl.className = 'text-sm font-semibold'
    item.appendChild(titleEl)
  }

  if (description) {
    const descEl = document.createElement('div')
    descEl.textContent = description
    descEl.className = 'text-xs opacity-90 mt-0.5'
    item.appendChild(descEl)
  }

  container.appendChild(item)

  // Auto-dismiss
  const remove = () => {
    try {
      item.style.opacity = '0'
      item.style.transform = 'translateY(4px)'
      setTimeout(() => container.removeChild(item), 200)
    } catch {}
  }

  setTimeout(remove, Math.max(1000, duration))

  // Return a handle if caller wants to dismiss manually
  return { dismiss: remove }
}

export function useToast() {
  return { toast }
}
