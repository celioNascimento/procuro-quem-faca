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
        descricaoProblema: descricao.trim(),
      })
      setCasoIdRecemCriado(caso.id)
    } catch (err) {
      console.error('Erro ao abrir caso:', err)
      // A mensagem vem do banco em português (ex.: "O prazo para abrir este caso já terminou.")
      setErro(err instanceof Error ? err.message : 'Não foi possível abrir o caso. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  // Etapa 2: caso já criado, aguardando fotos + confirmação final
  if (casoIdRecemCriado) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-green-800">
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
          <span className="text-sm font-semibold text-slate-700">
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
          className="min-h-12 w-full rounded-xl bg-blue-600 text-base font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
        >
          Concluir abertura
        </button>
      </div>
    )
  }

  // Etapa 1: descrição do problema
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-slate-700">
        Teve algum problema com este trabalho? Descreva o que aconteceu — o
        prestador terá 5 dias úteis para responder.
      </p>
      <p className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
        Quando o caso for encerrado, o que você escrever aqui e a resposta do prestador
        podem aparecer no perfil público dele. Evite dados pessoais, como telefone e endereço.
      </p>
      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Ex: A calha que foi consertada voltou a vazar durante a chuva de ontem..."
        rows={4}
        maxLength={2000}
        aria-label="Descreva o problema"
        className="w-full resize-none rounded-xl border border-slate-300 p-3 text-base text-slate-800 outline-none placeholder:text-slate-500 focus:border-blue-600"
      />
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${descricaoValida ? 'text-green-700' : 'text-slate-600'}`}>
          {descricao.trim().length}/{MIN_CARACTERES_DESCRICAO} caracteres mínimos
        </span>
        <button
          onClick={handleAbrirCaso}
          disabled={!descricaoValida || enviando}
          className="flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white transition-all hover:bg-orange-800 active:scale-95 disabled:bg-slate-200 disabled:text-slate-500"
        >
          {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {ehReclamacao ? 'Enviar reclamação' : 'Abrir garantia'}
        </button>
      </div>
      {erro && (
        <p role="alert" className="flex items-start gap-1.5 text-sm font-semibold text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {erro}
        </p>
      )}
    </div>
  )
}
