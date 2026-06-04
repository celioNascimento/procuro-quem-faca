'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface ErrorModalProps {
  show: boolean
  title: string
  message: string
  actionText?: string
  actionUrl?: string
  onClose: () => void
}

export function ErrorModal({
  show,
  title,
  message,
  actionText = 'Entendido',
  actionUrl,
  onClose,
}: ErrorModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto border border-red-100/50">
          <AlertCircle size={32} />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">
            {title}
          </h3>
          <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
            {message}
          </p>
        </div>
        
        {actionUrl ? (
          <Link href={actionUrl}>
            <button className="w-full mt-4 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100">
              {actionText}
            </button>
          </Link>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  )
}