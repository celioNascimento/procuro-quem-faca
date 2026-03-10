'use client'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HeaderMobile() {
  const router = useRouter()

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
       <div className="flex items-center gap-2">
         <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">P</div>
       </div>
       <button 
         onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
         className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg"
       >
         SAIR
       </button>
    </header>
  )
}
