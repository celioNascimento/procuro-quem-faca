//components/auth/SenhaInput.tsx

'use client'

import { useState } from 'react'
import { EyeIconButton } from './EyeIconButton'

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
      <EyeIconButton show={visivel} toggle={() => setVisivel(v => !v)} />
    </div>
  )
}