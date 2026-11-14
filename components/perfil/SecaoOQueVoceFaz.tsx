// components/perfil/SecaoOQueVoceFaz.tsx

'use client'

import { Briefcase, MessageCircle } from 'lucide-react'
import type { Grupo, Categoria } from '@/types/categorias'
import { NUMERO_WHATSAPP_PQF } from '@/lib/config/contato'
import { CartaoSecao, Campo } from '@/components/perfil/CartaoSecao'

interface SecaoOQueVoceFazProps {
  grupoId: string | number
  categoriaId: string | number
  habilidades: string[]
  listaGrupos: Grupo[]
  listaCategorias: Categoria[]
  inputStyle: string
  onGrupoChange: (id: string) => void
  onCategoriaChange: (id: string) => void
  onToggleHabilidade: (h: string) => void
}

export function SecaoOQueVoceFaz({
  grupoId,
  categoriaId,
  habilidades,
  listaGrupos,
  listaCategorias,
  inputStyle,
  onGrupoChange,
  onCategoriaChange,
  onToggleHabilidade,
}: SecaoOQueVoceFazProps) {
  const habilidadesExtras = listaCategorias
    .filter(cat => String(cat.id) !== String(categoriaId))
    .map(cat => cat.nome)

  return (
    <CartaoSecao
      titulo="O que você faz?"
      descricao="Escolha a sua área de atuação e a profissão principal."
      icone={<Briefcase size={20} />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Campo id="perfil-grupo" rotulo="Área de atuação">
          <select
            id="perfil-grupo"
            value={grupoId || ''}
            onChange={e => onGrupoChange(e.target.value)}
            className={inputStyle}
            required
          >
            <option value="">Selecione</option>
            {listaGrupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
        </Campo>

        <Campo id="perfil-categoria" rotulo="Profissão principal">
          <select
            id="perfil-categoria"
            value={categoriaId || ''}
            onChange={e => onCategoriaChange(e.target.value)}
            className={inputStyle}
            required
          >
            <option value="">Selecione</option>
            {listaCategorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Campo>
      </div>

      {categoriaId && habilidadesExtras.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p id="perfil-habilidades" className="text-sm font-bold text-slate-700">
            Outros serviços que você também faz <span className="ml-1 text-xs font-semibold text-slate-400">(opcional)</span>
          </p>
          <div role="group" aria-labelledby="perfil-habilidades" className="flex flex-wrap gap-2">
            {habilidadesExtras.map(h => {
              const marcada = !!habilidades?.includes(h)
              return (
                <button
                  key={h}
                  type="button"
                  aria-pressed={marcada}
                  onClick={() => onToggleHabilidade(h)}
                  className={`min-h-9 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                    marcada
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {h}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <a
        href={`https://wa.me/${NUMERO_WHATSAPP_PQF}?text=${encodeURIComponent(
          'Olá! Estou cadastrando meu perfil de prestador e não encontrei a categoria que descreve meu trabalho. Gostaria de sugerir uma nova categoria.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-9 items-center gap-2 self-start text-sm font-semibold text-slate-500 underline-offset-4 transition-colors hover:text-blue-600 hover:underline"
      >
        <MessageCircle size={16} aria-hidden="true" />
        Não encontrou sua profissão? Sugira pelo WhatsApp
      </a>
    </CartaoSecao>
  )
}
