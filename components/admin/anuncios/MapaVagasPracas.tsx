// components/admin/anuncios/MapaVagasPracas.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react'
import {
  listarEstados,
  listarRegioesPorEstado,
  listarGrupos,
  listarCategoriasPorGrupo,
  listarCidadesPorRegiao,
  verificarInventarioSegmento,
  verificarInventarioCliente,
} from '@/lib/services/adminAnuncios.service'

const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100'

const labelClass = 'text-[10px] font-medium text-zinc-400 uppercase tracking-widest'

// Posições fixas exibidas por praça (cidade + categoria). "dashboard_cliente"
// segmenta só por cidade (sem categoria) e usa verificarInventarioCliente,
// então é tratado à parte, fora do loop por categoria.
const POSICOES_PRACA = [
  { value: 'topo_busca', label: 'Topo da Busca' },
  { value: 'entre_cards', label: 'Entre Cards' },
  { value: 'topo_perfil', label: 'Topo do Perfil' },
  { value: 'dashboard_prestador', label: 'Painel Prestador' },
] as const

type StatusVaga = {
  posicao: string
  label: string
  vagasTotais: number
  vagasDisponiveis: number
  ocupados: number
  proximaExpiracao: string | null
  semPrestadores: boolean
}

type LinhaCidade = {
  cidadeId: string
  cidadeNome: string
  vagas: StatusVaga[]
  vagaCliente: StatusVaga
  carregando: boolean
}

function IndicadorVaga({ vaga }: { vaga: StatusVaga }) {
  if (vaga.semPrestadores) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl bg-zinc-50 border border-zinc-100 px-2 py-2 opacity-50">
        <Circle size={14} className="text-zinc-300" />
        <span className="text-[9px] font-medium text-zinc-300 text-center leading-tight">{vaga.label}</span>
        <span className="text-[9px] text-zinc-300">sem vagas</span>
      </div>
    )
  }

  const cheio = vaga.vagasDisponiveis === 0
  const parcial = !cheio && vaga.ocupados > 0

  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 ${
        cheio
          ? 'bg-red-50 border-red-100'
          : parcial
            ? 'bg-amber-50 border-amber-100'
            : 'bg-emerald-50 border-emerald-100'
      }`}
    >
      {cheio ? (
        <XCircle size={14} className="text-red-500" />
      ) : (
        <CheckCircle2 size={14} className={parcial ? 'text-amber-500' : 'text-emerald-500'} />
      )}
      <span className="text-[9px] font-semibold text-zinc-600 text-center leading-tight">{vaga.label}</span>
      <span
        className={`text-[10px] font-bold ${
          cheio ? 'text-red-600' : parcial ? 'text-amber-600' : 'text-emerald-600'
        }`}
      >
        {vaga.vagasDisponiveis}/{vaga.vagasTotais}
      </span>
      {cheio && vaga.proximaExpiracao && (
        <span className="text-[8px] text-zinc-400 text-center leading-tight">
          livre {new Date(vaga.proximaExpiracao).toLocaleDateString('pt-BR')}
        </span>
      )}
    </div>
  )
}

function CardCidade({ linha }: { linha: LinhaCidade }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <MapPin size={13} className="text-zinc-400" />
        <p className="text-[13px] font-bold text-zinc-800">{linha.cidadeNome}</p>
      </div>

      {linha.carregando ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={16} className="animate-spin text-zinc-300" />
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {linha.vagas.map((v) => (
            <IndicadorVaga key={v.posicao} vaga={v} />
          ))}
          <IndicadorVaga vaga={linha.vagaCliente} />
        </div>
      )}
    </div>
  )
}

export function MapaVagasPracas() {
  const [estados, setEstados] = useState<any[]>([])
  const [regioes, setRegioes] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])

  const [estadoSigla, setEstadoSigla] = useState('')
  const [regiaoId, setRegiaoId] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')

  const [linhas, setLinhas] = useState<LinhaCidade[]>([])
  const [carregandoCidades, setCarregandoCidades] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarEstados().then(setEstados).catch(() => setErro('Não foi possível carregar os estados.'))
    listarGrupos().then(setGrupos).catch(() => setErro('Não foi possível carregar os grupos de categoria.'))
  }, [])

  useEffect(() => {
    setRegiaoId('')
    setRegioes([])
    if (!estadoSigla) return
    listarRegioesPorEstado(estadoSigla).then(setRegioes).catch(() => setErro('Não foi possível carregar as regiões.'))
  }, [estadoSigla])

  useEffect(() => {
    setCategoriaId('')
    setCategorias([])
    if (!grupoId) return
    listarCategoriasPorGrupo(grupoId).then(setCategorias).catch(() => setErro('Não foi possível carregar as categorias.'))
  }, [grupoId])

  const carregarMapa = useCallback(async () => {
    if (!regiaoId || !categoriaId) {
      setLinhas([])
      return
    }

    setErro('')
    setCarregandoCidades(true)

    try {
      const cidades = await listarCidadesPorRegiao(regiaoId)

      // Mostra os cards já com skeleton, e preenche os dados por cidade em
      // paralelo — evita travar a tela inteira esperando todas as cidades.
      setLinhas(
        cidades.map((c: any) => ({
          cidadeId: String(c.id),
          cidadeNome: c.nome,
          vagas: [],
          vagaCliente: {
            posicao: 'dashboard_cliente',
            label: 'Painel Cliente',
            vagasTotais: 0,
            vagasDisponiveis: 0,
            ocupados: 0,
            proximaExpiracao: null,
            semPrestadores: false,
          },
          carregando: true,
        }))
      )

      await Promise.all(
        cidades.map(async (c: any) => {
          const cidadeId = String(c.id)

          const resultadosPosicoes = await Promise.all(
            POSICOES_PRACA.map(async (p) => {
              const inv = await verificarInventarioSegmento(cidadeId, categoriaId, p.value)
              return {
                posicao: p.value,
                label: p.label,
                vagasTotais: inv.vagasTotais,
                vagasDisponiveis: inv.vagasDisponiveis,
                ocupados: inv.ocupados,
                proximaExpiracao: inv.proximaExpiracao,
                // Só topo_busca/topo_perfil/dashboard_prestador têm vaga fixa
                // sempre igual a 1; entre_cards depende de haver prestador
                // suficiente na praça (floor(prestadores/4)). "Sem vagas"
                // significa vagasTotais 0 nessa posição específica.
                semPrestadores: inv.vagasTotais === 0,
              } as StatusVaga
            })
          )

          const invCliente = await verificarInventarioCliente(cidadeId)
          const vagaCliente: StatusVaga = {
            posicao: 'dashboard_cliente',
            label: 'Painel Cliente',
            vagasTotais: invCliente.vagasTotais,
            vagasDisponiveis: invCliente.vagasDisponiveis,
            ocupados: invCliente.ocupados,
            proximaExpiracao: invCliente.proximaExpiracao,
            semPrestadores: false, // painel do cliente não depende de prestador cadastrado
          }

          setLinhas((atual) =>
            atual.map((linha) =>
              linha.cidadeId === cidadeId
                ? { ...linha, vagas: resultadosPosicoes, vagaCliente, carregando: false }
                : linha
            )
          )
        })
      )
    } catch (e) {
      console.error(e)
      setErro('Não foi possível carregar o mapa de vagas para essa seleção.')
    } finally {
      setCarregandoCidades(false)
    }
  }, [regiaoId, categoriaId])

  useEffect(() => {
    carregarMapa()
  }, [carregarMapa])

  // Oculta por padrão praças sem nenhuma vaga possível (nenhuma posição tem
  // vagasTotais > 0), já que sem prestador cadastrado ali não há o que
  // oferecer a um anunciante.
  const linhasComVagaPossivel = linhas.filter(
    (l) => l.carregando || l.vagas.some((v) => !v.semPrestadores) || l.vagaCliente.vagasTotais > 0
  )

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 rounded-2xl border border-zinc-100 bg-white p-4">
        <label className="block">
          <span className={`mb-1.5 block ${labelClass}`}>Estado</span>
          <select className={inputClass} value={estadoSigla} onChange={(e) => setEstadoSigla(e.target.value)}>
            <option value="">Selecione...</option>
            {estados.map((e) => (
              <option key={e.sigla} value={e.sigla}>{e.nome}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={`mb-1.5 block ${labelClass}`}>Região</span>
          <select className={inputClass} value={regiaoId} onChange={(e) => setRegiaoId(e.target.value)} disabled={!estadoSigla}>
            <option value="">Selecione...</option>
            {regioes.map((r) => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={`mb-1.5 block ${labelClass}`}>Grupo</span>
          <select className={inputClass} value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
            <option value="">Selecione...</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={`mb-1.5 block ${labelClass}`}>Categoria</span>
          <select className={inputClass} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} disabled={!grupoId}>
            <option value="">Selecione...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
      </div>

      {erro && (
        <div className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-600">{erro}</div>
      )}

      {!regiaoId || !categoriaId ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
          <p className="text-[13px] font-semibold text-zinc-500">Selecione região e categoria</p>
          <p className="mt-1 text-[11px] text-zinc-300">O mapa de vagas aparece aqui depois do filtro</p>
        </div>
      ) : carregandoCidades && linhas.length === 0 ? (
        <div className="mt-6 flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-zinc-300" />
        </div>
      ) : linhasComVagaPossivel.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
          <p className="text-[13px] font-semibold text-zinc-500">Nenhuma praça com vaga possível nessa região/categoria</p>
          <p className="mt-1 text-[11px] text-zinc-300">Isso costuma significar que ainda não há prestadores ativos suficientes ali</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {linhasComVagaPossivel.map((linha) => (
            <CardCidade key={linha.cidadeId} linha={linha} />
          ))}
        </motion.div>
      )}
    </div>
  )
}
