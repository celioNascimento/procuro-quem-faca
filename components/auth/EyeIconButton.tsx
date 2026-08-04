//components/auth/EyeIconButton.tsx

'use client'
import { Eye, EyeOff } from 'lucide-react'

interface EyeIconButtonProps {
  show: boolean
  toggle: () => void
}

export function EyeIconButton({ show, toggle }: EyeIconButtonProps) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors p-1"
      tabIndex={-1}
    >
      {show ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
    </button>
  )
}