//components/perfil/CardPerfilCliente.tsx 

'use client'
import { Camera, Loader2, User, MapPin, Activity, Clock } from 'lucide-react'

interface Props {
  nome: string
  email: string
  avatarUrl: string
  bairro?: string
  cidade?: string
  uf?: string
  ativosCount: number
  totalCount: number
  uploading: boolean
  onUploadClick: () => void
}

export default function CardPerfilCliente({
  nome,
  email,
  avatarUrl,
  bairro,
  cidade,
  uf,
  ativosCount,
  totalCount,
  uploading,
  onUploadClick,
}: Props) {
  const localizacao = [bairro, cidade, uf].filter(v => v?.trim()).join(', ')

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm" aria-labelledby="client-profile-name">
      <div className="flex items-center gap-4 bg-blue-50 p-4 lg:flex-col lg:items-stretch lg:gap-0 lg:p-0">
        <button
          type="button"
          className="group relative size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 lg:aspect-[4/3] lg:size-auto lg:rounded-none lg:border-0"
          onClick={onUploadClick}
          aria-label="Alterar foto do perfil"
          disabled={uploading}
        >
          {uploading ? (
            <span className="flex size-full items-center justify-center bg-slate-50">
              <Loader2 size={24} className="animate-spin text-blue-500" aria-hidden="true" />
            </span>
          ) : avatarUrl ? (
            <img
              src={avatarUrl}
              className="size-full object-cover"
              alt={nome ? `Foto de ${nome}` : 'Foto do perfil'}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <span className="flex size-full items-center justify-center bg-slate-100 text-slate-300">
              <User size={32} aria-hidden="true" />
            </span>
          )}
          {!uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera size={20} aria-hidden="true" />
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1 p-0 lg:p-5">
          <h2 id="client-profile-name" className="text-pretty text-base font-black leading-tight tracking-tight text-slate-800 lg:text-lg">
            {nome || 'Sua conta'}
          </h2>
          <p className="mt-1 truncate text-[11px] font-bold tracking-wide text-blue-600">{email}</p>
          {localizacao && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium leading-relaxed text-slate-500">
              <MapPin size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              {localizacao}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3 lg:px-5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
          <Activity size={11} aria-hidden="true" />
          {ativosCount} ativo{ativosCount !== 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
          <Clock size={11} aria-hidden="true" />
          {totalCount} projeto{totalCount !== 1 ? 's' : ''}
        </span>
      </div>
    </section>
  )
}
