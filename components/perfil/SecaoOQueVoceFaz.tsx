//components/perfil/SecaoOQueVoceFaz.tsx

'use client'

import type { Grupo, Categoria } from '@/types/categorias'

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
    <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
      <h2 className="font-bold uppercase text-[11px] tracking-widest text-slate-400 mb-4">O que você faz?</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={grupoId || ''}
          onChange={e => onGrupoChange(e.target.value)}
          className={inputStyle}
          required
        >
          <option value="">Grupo de Atuação</option>
          {listaGrupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
        </select>

        <select
          value={categoriaId || ''}
          onChange={e => onCategoriaChange(e.target.value)}
          className={inputStyle}
          required
        >
          <option value="">Profissão Principal</option>
          {listaCategorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {categoriaId && habilidadesExtras.length > 0 && (
        <div className="pt-2">
          <label className="text-slate-400 font-bold text-[10px] uppercase block mb-3 tracking-widest">
            Habilidades extras:
          </label>
          <div className="flex flex-wrap gap-2">
            {habilidadesExtras.map(h => (
              <button
                key={h}
                type="button"
                onClick={() => onToggleHabilidade(h)}
                className={`px-4 py-2.5 rounded-xl text-[11px] font-semibold uppercase transition-all border ${
                  habilidades?.includes(h)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}