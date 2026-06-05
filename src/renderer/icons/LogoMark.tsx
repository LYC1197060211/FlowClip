import { useId } from 'react'

/** The FlowClip mark: layered content cards with a small flow signal. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="15" y1="10" x2="85" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#101827" />
          <stop offset="1" stopColor="#087E82" />
        </linearGradient>
        <linearGradient id={`${id}-back`} x1="26" y1="18" x2="66" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E2FFFA" />
          <stop offset="1" stopColor="#97EFDD" />
        </linearGradient>
        <linearGradient id={`${id}-front`} x1="35" y1="28" x2="78" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#E6F7F4" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="84" height="84" rx="22" fill={`url(#${id}-bg)`} />
      <rect x="20" y="18" width="50" height="58" rx="11" fill={`url(#${id}-back)`} />
      <rect x="30" y="30" width="50" height="52" rx="11" fill={`url(#${id}-front)`} />
      <rect x="39" y="44" width="31" height="4.5" rx="2.25" fill="#0F766E" />
      <rect x="39" y="55" width="24" height="4" rx="2" fill="#14B8A6" />
      <circle cx="42.5" cy="70.5" r="3" fill="#2DD4BF" />
      <circle cx="51.5" cy="70.5" r="3" fill="#2DD4BF" />
      <circle cx="60.5" cy="70.5" r="3" fill="#2DD4BF" />
    </svg>
  )
}
