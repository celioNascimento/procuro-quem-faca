'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface GoogleButtonProps {
  text?: string
  onLog?: (acao: string, detalhes?: Record<string, any>) => Promise<void> | void
}

export default function GoogleButton({ text = "Continuar com Google", onLog }: GoogleButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleLogin = async () => {
    try {
      setIsRedirecting(true)

      // Registra o log de tentativa se a função for fornecida
      if (onLog) {
        await onLog('TENTATIVA_LOGIN_GOOGLE', { platform: 'web' })
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // IMPORTANTE: Use origin para garantir que a URL seja absoluta e sem barras extras
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
    } catch (error: any) {
      console.error('Erro login Google:', error.message)
      setIsRedirecting(false)
    }
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isRedirecting}
      className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-100 p-4 rounded-3xl font-black text-slate-700 text-sm uppercase tracking-tighter hover:border-blue-500 hover:bg-blue-50/30 transition-all active:scale-95 disabled:opacity-70"
    >
      {isRedirecting ? (
        <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>{text}</span>
        </>
      )}
    </button>
  )
} 