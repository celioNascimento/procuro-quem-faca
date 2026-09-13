//components/ui/Avatar.tsx

'use client'
import { User } from 'lucide-react'

import type { AvatarProps } from './Avatar.types'

export function Avatar({ url, alt = 'Avatar', className = "w-9 h-9", fallbackSize = 14 }: AvatarProps) {
  return (
    <div className={`rounded-full overflow-hidden shrink-0 ${className}`}>
      {url ? (
        <img
          src={url}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
          <User size={fallbackSize} />
        </div>
      )}
    </div>
  )
}
