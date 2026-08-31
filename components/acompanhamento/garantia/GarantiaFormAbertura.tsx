// components/acompanhamento/garantia/GarantiaFormAbertura.tsx
//
// Formulário para o cliente abrir um novo caso de garantia OU reclamação
// (tipo decidido por verificarElegibilidadeGarantia, recebido via prop —
// o cliente não escolhe, é uma consequência de garantia_dias do prestador).
// Exige descrição do problema + ao menos uma foto (evidência), reaproveitando
// o padrão de upload já usado em useGarantiaWizard (fase='problema',
// automática para autorTipo='cliente').
//
// Upload de foto só é possível DEPOIS que o caso existe (garantia_fotos.caso_id
// é not null) — então o fluxo aqui é: 1) criar o caso com abrirCasoGarantiaCliente,
// 2) só então liberar o upload via useGarantiaWizard, já apontando pro caso recém-criado.

'use client'

import { useState } from 'react'
import { AlertCircle, Camera, Loader2, Send } from 'lucide-react'
import { abrirCasoGarantiaCliente } from '@/lib/services/garantia.service'
import { useGarantiaWizard } from '@/hooks/useGarantiaWizard'
import { FotoGarantia } from '@/components/dashboard/wizard/garantia/FotoGarantia'

const MIN_CARACTERES_DESCRICAO = 20

interface Props {
  projetoId: string
  clienteUserId: string
  tipo: 'garantia' | 'reclamacao'
  onAberto: () => void
}

export function GarantiaFormAbertura({ projetoId, clienteUserId, tipo, onAberto }: Props) {
  const [descricao, setDescricao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [casoIdRecemCriado, setCasoIdRecemCriado] = useState<string | null>(null)

  const ehReclamacao = tipo === 'reclamacao'

  // Só existe uma vez que o caso foi criado — habilita o upload de fotos
  // do problema antes do cliente finalizar a abertura.
  const wizard = useGarantiaWizard({
    casoId: casoIdRecemCriado ?? '',
    autorTipo: 'cliente',
    autorUserId: clienteUserId,
  })

  const descricaoValida = descricao.trim().length >= MIN_CARACTERES_DESCRICAO

  const handleAbrirCaso = async () => {
    if (!descricaoValida || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      const caso = await abrirCasoGarantiaCliente({
        projetoId,
        clienteUserId,
        descricaoProblema: descricao.trim(),
      })
      setCasoIdRecemCriado(caso.id)
    } catch (err) {
      console.error('Erro ao abrir caso:', err)
      setErro('Não foi possível abrir o caso. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  // Etapa 2: caso já criado, aguardando fotos + confirmação final
  if (casoIdRecemCriado) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-green-700">
            {ehReclamacao ? 'Reclamação registrada.' : 'Caso aberto.'} Anexe fotos do
            problema para o prestador entender melhor.
          </p>
        </div>

        {wizard.state.fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {wizard.state.fotos.map((foto) => (
              <div key={foto.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                <FotoGarantia path={foto.url_foto} publica={foto.publica} className="w-full h-full object-cover" alt="" />
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl py-4 cursor-pointer hover:border-blue-300 transition-colors">
          {wizard.state.enviandoFoto ? (
            <Loader2 size={16} className="animate-spin text-blue-400" />
          ) : (
            <Camera size={16} className="text-slate-400" />
          )}
          <span className="text-[10px] font-bold uppercase text-slate-400">
            {wizard.state.enviandoFoto ? 'Enviando...' : 'Anexar foto do problema'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => wizard.actions.handleUpload(e, 'problema')}
            disabled={wizard.state.enviandoFoto}
          />
        </label>

        <button
          onClick={onAberto}
          className="w-full bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95"
        >
          Concluir abertura
        </button>
      </div>
    )
  }

  // Etapa 1: descrição do problema
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500 leading-snug">
        Teve algum problema com este serviço? Descreva o que aconteceu — o
        prestador terá 5 dias úteis para responder.
      </p>
      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Ex: A calha que foi consertada voltou a vazar durante a chuva de ontem..."
        rows={4}
        className="w-full text-[12px] font-medium text-slate-700 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-300 resize-none"
      />
      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-bold ${descricaoValida ? 'text-green-500' : 'text-slate-300'}`}>
          {descricao.trim().length}/{MIN_CARACTERES_DESCRICAO} caracteres mínimos
        </span>
        <button
          onClick={handleAbrirCaso}
          disabled={!descricaoValida || enviando}
          className="flex items-center gap-2 bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all active:scale-95"
        >
          {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {ehReclamacao ? 'Enviar reclamação' : 'Abrir garantia'}
        </button>
      </div>
      {erro && (
        <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
          <AlertCircle size={10} /> {erro}
        </p>
      )}
    </div>
  )
}
