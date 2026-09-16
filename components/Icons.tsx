/**
 * Inline stroke icons. Pictograms carry real weight here — a user who reads
 * slowly, or reads a script the interface has fallen back on, navigates by
 * shape before text.
 */

type P = { className?: string }

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export const ChatIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-2.8-.4L3 21l1.6-4.6A8.3 8.3 0 0 1 3.6 11 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
  </svg>
)

export const SymptomsIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6 3v5a4 4 0 0 0 8 0V3" />
    <path d="M10 15v1a5 5 0 0 0 10 0v-2" />
    <circle cx="20" cy="11" r="2" />
  </svg>
)

export const AlertIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3a6 6 0 0 0-6 6c0 4-1.5 5.5-2 6h16c-.5-.5-2-2-2-6a6 6 0 0 0-6-6Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
)

export const CameraIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2a1.5 1.5 0 0 0 1.25-.67l.6-.9A1.5 1.5 0 0 1 9.8 4.7h4.4a1.5 1.5 0 0 1 1.25.67l.6.9A1.5 1.5 0 0 0 17.3 7h2.2A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
)

export const SendIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 12 20 4l-8 16-2-6-6-2Z" />
  </svg>
)

export const PhoneIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6.6 3.5h2.7l1.4 3.4-1.8 1.4a11 11 0 0 0 5 5l1.4-1.8 3.4 1.4v2.7a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />
  </svg>
)

export const GlobeIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
  </svg>
)

export const SparkIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.6L12 17.5l-1.6-5.3L5 10.6 10.4 9 12 3.5Z" />
  </svg>
)

export const CloseIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

export const ShieldIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3.2 5 6v5.5c0 4.2 2.9 7.6 7 9.3 4.1-1.7 7-5.1 7-9.3V6l-7-2.8Z" />
    <path d="m9.2 12 2 2 3.6-3.8" />
  </svg>
)
