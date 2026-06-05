import { useUi } from '@renderer/store/useUi'

/** Transient toast shown near the bottom of the window. */
export function Toast() {
  const toast = useUi((s) => s.toast)
  if (!toast) return null
  return (
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-[60] max-w-[88%] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-center text-xs font-medium text-surface shadow-floating">
      {toast.message}
    </div>
  )
}
