'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import RatingStars from '@/components/ui/RatingStars'

export default function AvaliacoesTab({ prestadorId }) {
  const [avaliacoes, setAvaliacoes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function buscarAvaliacoes() {
      const { data } = await supabase
        .from('avaliacoes')
        .select(`
          *,
          portfolio_projetos(titulo)
        `)
        .eq('prestador_id', prestadorId)
        .eq('visivel', true)
        .order('created_at', { ascending: false })
      
      setAvaliacoes(data || [])
      setLoading(false)
    }
    buscarAvaliacoes()
  }, [prestadorId])

  const media = avaliacoes.length > 0 
    ? (avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length).toFixed(1)
    : 0

  if (loading) return <div className="animate-pulse h-40 bg-slate-50 rounded-[3rem]" />

  return (
    <div className="space-y-8">
      {/* Resumo da Média mantido */}
      {/* ... */}

      {/* Lista de Depoimentos */}
      <div className="grid gap-4">
        {avaliacoes.map((av) => (
          <div key={av.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <RatingStars nota={av.nota} />
                {av.portfolio_projetos && (
                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter mt-1 block italic">
                    Referente ao serviço: {av.portfolio_projetos.titulo}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold text-slate-300 uppercase italic">
                {new Date(av.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            {/* CORREÇÃO: Usando entidade HTML para aspas */}
            <p className="text-slate-600 text-sm italic font-medium">&quot;{av.comentario}&quot;</p>
          </div>
        ))}
        {/* ... restante mantido ... */}
      </div>
    </div>
  )
}