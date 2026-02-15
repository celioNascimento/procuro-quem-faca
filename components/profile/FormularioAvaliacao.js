'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import RatingStars from '@/components/ui/RatingStars' // Usando o que criamos antes

export default function FormularioAvaliacao({ projetoId, prestadorId, clienteId, onComplete }) {
  const [loading, setLoading] = useState(false)
  const [nota, setNota] = useState(5)
  const [comentario, setComentario] = useState('')
  const [isContestacao, setIsContestacao] = useState(false)
  const [fotosEvidencia, setFotosEvidencia] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Insere a Avaliação Base
      const { data: avaliacao, error: avError } = await supabase
        .from('avaliacoes')
        .insert({
          projeto_id: projetoId,
          prestador_id: prestadorId,
          cliente_id: clienteId,
          nota: isContestacao ? 1 : nota,
          comentario,
          em_disputa: isContestacao,
          visivel: !isContestacao // Contestações ficam ocultas até mediação ou resposta
        })
        .select().single()

      if (avError) throw avError

      // 2. Se for contestação, poderíamos lidar com o upload de fotos aqui
      if (isContestacao) {
        await supabase.from('contestacoes').insert({
          avaliacao_id: avaliacao.id,
          projeto_id: projetoId,
          descricao: comentario,
          fotos_evidencia: fotosEvidencia // URLs após upload
        })
      }

      alert(isContestacao ? "Chamado de assistência enviado ao prestador." : "Avaliação publicada!")
      onComplete()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-black uppercase italic text-slate-800">Sua opinião é fundamental</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {isContestacao ? "Relate o problema para suporte" : "Como foi sua experiência?"}
        </p>
      </div>

      {!isContestacao && (
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(num => (
            <button key={num} onClick={() => setNota(num)} className="text-2xl transition-transform active:scale-90">
              {num <= nota ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      )}

      <textarea 
        className="w-full bg-slate-50 rounded-3xl p-6 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 min-h-[120px] resize-none"
        placeholder={isContestacao ? "Descreva o que aconteceu (ex: vazamento, rachadura)..." : "Escreva seu depoimento aqui..."}
        value={comentario}
        onChange={e => setComentario(e.target.value)}
      />

      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={isContestacao} 
            onChange={e => setIsContestacao(e.target.checked)}
            className="w-5 h-5 rounded-lg border-slate-200 text-red-500 focus:ring-red-100"
          />
          <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-red-500 transition-colors">
            Reportar problema / Solicitar Garantia
          </span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={loading || !comentario}
          className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${
            isContestacao 
            ? 'bg-red-500 text-white shadow-red-100 hover:bg-red-600' 
            : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
          }`}
        >
          {loading ? 'ENVIANDO...' : (isContestacao ? 'ABRIR CHAMADO DE ASSISTÊNCIA' : 'PUBLICAR AVALIAÇÃO')}
        </button>
      </div>
    </div>
  )
}