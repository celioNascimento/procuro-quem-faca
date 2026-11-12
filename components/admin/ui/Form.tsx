import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from './cn'

// Campo com rótulo acima. Os controles abaixo compartilham a mesma aparência.
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-semibold text-pqf-muted">{label}</span>
      {children}
    </label>
  )
}

const CONTROLE =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-pqf-ink placeholder:text-slate-400 ' +
  'outline-none transition-colors focus:border-pqf-blue focus:ring-4 focus:ring-pqf-blue/10 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-pqf-muted'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROLE, className)} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(CONTROLE, className)}>{children}</select>
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROLE, 'resize-none', className)} />
}
