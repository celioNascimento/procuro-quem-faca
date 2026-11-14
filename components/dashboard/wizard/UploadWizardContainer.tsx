// components/dashboard/wizard/UploadWizardContainer.tsx
//
// Tela de criar e acompanhar um trabalho com cliente. É uma tela guiada: o indicador de passos e a
// frase "Agora:" dizem o que fazer, cada bloco aparece quando chega a vez dele e as palavras são as
// do prestador (nada de status técnico). Regras de negócio inalteradas: o telefone do cliente é
// obrigatório, o aceite e a avaliação vão por link, e as fotos 2 e 3 só liberam depois do aceite.
'use client'

import { Loader2 } from 'lucide-react'
import { Projeto } from '@/hooks/usePortfolioDashboard'
import { useUploadWizard } from '@/hooks/useUploadWizard'
import { useCasoGarantiaDoProjeto } from '@/hooks/useCasoGarantiaDoProjeto'
import { WizardCompleted } from './WizardCompleted'
import { WizardZoomModal } from './WizardZoomModal'
import { GarantiaSecaoWizard } from './garantia/GarantiaSecaoWizard'
import { PassosDoTrabalho } from './PassosDoTrabalho'
import { DadosDoClienteCard } from './DadosDoClienteCard'
import { CartaoDeFoto } from './CartaoDeFoto'
import { EnvioAoCliente } from './EnvioAoCliente'
import { passosDoTrabalho, proximaAcao, type SituacaoDoTrabalho } from '@/lib/trabalho/passos'
import { seloDoTrabalho, type TomDoSelo } from '@/lib/trabalho/statusTrabalho'
import { mensagemDeAceite, mensagemDeConclusao } from '@/lib/trabalho/mensagens'
import type { EtapaFoto } from '@/lib/trabalho/descricaoFotos'

interface UploadWizardContainerProps {
  prestadorId: number
  projetoExistente?: Projeto | null
  onComplete: () => void
  onVoltar?: () => void
  isEdicao?: boolean
}

const ETAPAS: EtapaFoto[] = [1, 2, 3]

const COR_DO_SELO: Record<TomDoSelo, string> = {
  neutro: 'bg-slate-100 text-slate-700',
  aviso: 'bg-amber-100 text-amber-900',
  andamento: 'bg-blue-100 text-blue-800',
  sucesso: 'bg-emerald-100 text-emerald-800',
}

// Posição de cada foto na coluna única do celular (o aceite fica entre o antes e o durante).
const ORDEM_DA_FOTO: Record<EtapaFoto, string> = { 1: 'order-2', 2: 'order-4', 3: 'order-5' }

const MOTIVO_SEM_AUTORIZACAO = 'Uma das fotos mostra uma pessoa e falta confirmar a autorização dela. Confirme na foto ou troque a imagem.'

export function UploadWizardContainer({ prestadorId, projetoExistente = null, onVoltar }: UploadWizardContainerProps) {
  const hookData = useUploadWizard(prestadorId, projetoExistente)

  const { isProjetoConcluido, isPhoneValid, isTitleValid, isProjetoPendente, semFotos, podeGerarLinkAvaliacao, mostrarEscolhaFluxo, fotoComPessoaSemAutorizacao } = hookData.derived
  const {
    zoomEtapa, clienteNome, titulo, aguardandoAvaliacao, erroUpload, projetoId, projetoStatus,
    fotosUrls, fotosData, loadingEtapa, linkGerado, marcandoConcluido, marcadoConcluidoAt, prestadorInfo,
  } = hookData.state
  const {
    setErroUpload, setZoomEtapa, handleUpload, iniciarServicoSemFoto, marcarComoConcluido, escolherFluxo,
    gerarLinkAceite, gerarLinkConclusao, copiarAceite, copiarConclusao, salvarDescricaoFoto, salvarAutorizacaoFoto,
  } = hookData.actions

  // Garantia e reclamação mudam o selo do topo, sem consulta repetida.
  const { caso: casoGarantia, loading: loadingCaso, recarregar: recarregarCaso } = useCasoGarantiaDoProjeto(isProjetoConcluido ? (projetoId ?? null) : null)
  const casoAberto = isProjetoConcluido && !loadingCaso && casoGarantia !== null ? (casoGarantia?.tipo === 'reclamacao' ? 'reclamacao' : 'garantia') : null

  const selo = projetoId ? seloDoTrabalho({ status: projetoStatus, aguardandoAvaliacao, caso: casoAberto }) : null

  // Aceite enviado = o link já foi gerado e o trabalho saiu do rascunho (gerar o aceite muda "em_registro" para "pendente").
  const aceiteEnviado = linkGerado && !!projetoId && projetoStatus !== 'em_registro'

  const situacao: SituacaoDoTrabalho = {
    semFotos,
    dadosValidos: isPhoneValid && isTitleValid,
    projetoCriado: !!projetoId,
    fotos: [!!fotosUrls[1], !!fotosUrls[2], !!fotosUrls[3]],
    aceiteEnviado,
    status: projetoStatus,
    marcadoConcluido: !!marcadoConcluidoAt,
    aguardandoAvaliacao,
    concluido: isProjetoConcluido,
  }
  const passos = passosDoTrabalho(situacao)

  const previaAceite = mensagemDeAceite({ clienteNome, titulo, link: '(o link do acompanhamento aparece aqui)' })
  const previaConclusao = mensagemDeConclusao({ clienteNome, titulo, link: '(o link da avaliação aparece aqui)' })

  const mostrarAceiteComFotos = !semFotos && !!fotosUrls[1] && !isProjetoConcluido
  const mostrarConclusaoComFotos = !semFotos && !isProjetoConcluido && podeGerarLinkAvaliacao && aguardandoAvaliacao

  return (
    <>
      <div className="flex w-full flex-col gap-4 sm:gap-5 sm:rounded-[2rem] sm:border sm:border-slate-200 sm:bg-[#F8FAFC] sm:p-6">
        {/* ── Cabeçalho ── */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">{projetoId ? 'Trabalho' : 'Novo trabalho'}</p>
            <h2 className="truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              {projetoId && titulo ? titulo : 'Registre um trabalho com cliente'}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selo && <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${COR_DO_SELO[selo.tom]}`}>{selo.texto}</span>}
            {onVoltar && (
              <button type="button" onClick={onVoltar} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700">
                ← Voltar
              </button>
            )}
          </div>
        </header>

        {!isProjetoConcluido && <PassosDoTrabalho passos={passos} proximaAcao={proximaAcao(situacao)} />}

        {erroUpload && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            <span>{erroUpload}</span>
            <button type="button" onClick={() => setErroUpload(null)} className="shrink-0 font-bold underline">Fechar aviso</button>
          </div>
        )}

        {isProjetoConcluido ? (
          <>
            <DadosDoClienteCard hookData={hookData} />
            <WizardCompleted hookData={hookData} prestadorId={prestadorId} />
            {projetoId && (
              <GarantiaSecaoWizard prestadorId={prestadorId} caso={casoGarantia} loadingCaso={loadingCaso} recarregar={recarregarCaso} />
            )}
          </>
        ) : mostrarEscolhaFluxo ? (
          /* ── Escolha: com ou sem fotos ── */
          <div className="flex flex-col gap-4 lg:max-w-3xl">
            <DadosDoClienteCard hookData={hookData} />
            <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5" aria-label="Como registrar o trabalho">
              <h3 className="text-base font-black text-slate-900">Como você quer registrar este trabalho?</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => escolherFluxo(false)}
                  className={`flex min-h-24 flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-colors hover:border-blue-400 ${prestadorInfo.portfolioObrigatorio ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'}`}
                >
                  <span className="text-base font-black text-slate-900">Com fotos</span>
                  <span className="text-sm text-slate-600">Antes, durante e depois. Mostra o seu trabalho no perfil.</span>
                </button>
                <button
                  type="button"
                  onClick={() => escolherFluxo(true)}
                  className={`flex min-h-24 flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-colors hover:border-blue-400 ${!prestadorInfo.portfolioObrigatorio ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'}`}
                >
                  <span className="text-base font-black text-slate-900">Sem fotos</span>
                  <span className="text-sm text-slate-600">Só o aceite e a avaliação do cliente.</span>
                </button>
              </div>
            </section>
          </div>
        ) : semFotos ? (
          /* ── Caminho sem fotos ── */
          <div className="flex flex-col gap-4 lg:max-w-3xl">
            <DadosDoClienteCard hookData={hookData} />
            {!projetoId ? (
              <button
                type="button"
                onClick={iniciarServicoSemFoto}
                disabled={!isPhoneValid || !isTitleValid}
                className="min-h-12 rounded-2xl bg-blue-600 px-6 text-base font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                Iniciar serviço
              </button>
            ) : isProjetoPendente ? (
              <EnvioAoCliente
                titulo="Enviar o aceite ao cliente"
                explicacao={`${clienteNome || 'O cliente'} confirma o início do serviço pelo link que você enviar.`}
                rotuloEnviar="Enviar o aceite pelo WhatsApp"
                previa={previaAceite}
                onEnviar={gerarLinkAceite}
                onCopiar={copiarAceite}
              />
            ) : !marcadoConcluidoAt ? (
              <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5" aria-label="Concluir o serviço">
                <h3 className="text-base font-black text-slate-900">Serviço em andamento</h3>
                <p className="text-sm text-slate-600">Quando terminar, marque como concluído para poder pedir a avaliação ao cliente.</p>
                <button
                  type="button"
                  onClick={marcarComoConcluido}
                  disabled={marcandoConcluido}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-base font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {marcandoConcluido ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Marcando…</> : 'Marcar como concluído'}
                </button>
              </section>
            ) : (
              <EnvioAoCliente
                titulo="Pedir a avaliação ao cliente"
                explicacao="O serviço está concluído. Envie o link para o cliente avaliar o trabalho."
                rotuloEnviar="Pedir a avaliação pelo WhatsApp"
                previa={previaConclusao}
                onEnviar={gerarLinkConclusao}
                onCopiar={copiarConclusao}
              />
            )}
          </div>
        ) : (
          /* ── Caminho com fotos. No celular, uma coluna na ordem do passo a passo (dados → antes → aceite →
               durante → depois → avaliação). No computador, duas colunas: à esquerda os dados e os envios ao
               cliente, à direita as três fotos. As colunas viram "contents" no celular para o `order` valer. ── */
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-6">
            <div className="contents lg:flex lg:flex-col lg:gap-4">
              <div className="order-1"><DadosDoClienteCard hookData={hookData} /></div>

              {mostrarAceiteComFotos && (
                <div className="order-3">
                  <EnvioAoCliente
                    titulo="Enviar o aceite ao cliente"
                    explicacao="O cliente confirma o início do serviço pelo link. Depois disso, você libera as fotos do durante e do depois."
                    rotuloEnviar="Enviar o aceite pelo WhatsApp"
                    previa={previaAceite}
                    onEnviar={gerarLinkAceite}
                    onCopiar={copiarAceite}
                    desabilitado={fotoComPessoaSemAutorizacao}
                    motivoDesabilitado={MOTIVO_SEM_AUTORIZACAO}
                    jaEnviado={aceiteEnviado}
                  />
                </div>
              )}

              {mostrarConclusaoComFotos && (
                <div className="order-6">
                  <EnvioAoCliente
                    titulo="Pedir a avaliação ao cliente"
                    explicacao="As três fotos estão registradas. Envie o link para o cliente conferir o resultado e avaliar."
                    rotuloEnviar="Pedir a avaliação pelo WhatsApp"
                    previa={previaConclusao}
                    onEnviar={gerarLinkConclusao}
                    onCopiar={copiarConclusao}
                    desabilitado={fotoComPessoaSemAutorizacao}
                    motivoDesabilitado={MOTIVO_SEM_AUTORIZACAO}
                  />
                </div>
              )}
            </div>

            <div className="contents lg:flex lg:flex-col lg:gap-4">
              {ETAPAS.map((etapa) => {
                const fotoUrl = fotosUrls[etapa] ?? null
                const foto = fotosData[etapa]
                const dadosOk = isPhoneValid && isTitleValid
                const bloqueada = etapa === 1 ? !dadosOk : !aceiteEnviado
                const motivo = etapa === 1
                  ? 'Preencha o WhatsApp do cliente e o nome do serviço para liberar esta foto.'
                  : 'Envie o aceite ao cliente para liberar esta foto.'
                return (
                  <div key={etapa} className={ORDEM_DA_FOTO[etapa]}>
                    <CartaoDeFoto
                      key={`${etapa}-${fotoUrl ?? 'vazia'}`}
                      etapa={etapa}
                      fotoUrl={fotoUrl}
                      descricaoInicial={foto?.legenda ?? ''}
                      exemploDaCategoria={prestadorInfo.exemploDescricao}
                      bloqueada={bloqueada}
                      motivoBloqueio={motivo}
                      enviando={!!loadingEtapa[etapa]}
                      contemPessoas={!!foto?.contem_pessoas}
                      autorizado={!!foto?.consentimento_terceiros_confirmado}
                      onEscolherArquivo={(e) => handleUpload(e, etapa)}
                      onSalvarDescricao={(texto) => salvarDescricaoFoto(etapa, texto)}
                      onAutorizacao={(pessoas, ok) => salvarAutorizacaoFoto(etapa, pessoas, ok)}
                      onAmpliar={() => setZoomEtapa(etapa)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {zoomEtapa && <WizardZoomModal hookData={hookData} />}
    </>
  )
}
