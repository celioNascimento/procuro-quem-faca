'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface SenhaInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  className?: string
  required?: boolean
}

export function SenhaInput({ value, onChange, placeholder, className = '', required }: SenhaInputProps) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div className="relative">
      <input
        type={visivel ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className} pr-12`}
        required={required}
      />
      <button
        type="button"
        onClick={() => setVisivel(v => !v)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors p-1"
        tabIndex={-1}
        aria-label={visivel ? 'Ocultar senha' : 'Ver senha'}
      >
        {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}