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
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">

      {/* Banner + Avatar + Info lado a lado */}
      <div className="w-full bg-gradient-to-br from-blue-50 to-slate-100 px-5 py-5 flex items-center gap-4">

        {/* Avatar clicável */}
        <div className="relative shrink-0 group cursor-pointer" onClick={onUploadClick}>
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
            {uploading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                className="w-full h-full object-cover"
                alt={nome}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <User size={32} className="text-slate-300" />
              </div>
            )}

            {/* Overlay de câmera ao hover */}
            {!uploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Camera size={20} className="text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Nome + email + localização */}
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-[15px] text-slate-800 leading-tight tracking-tight uppercase italic break-words">
            {nome || 'Sua conta'}
          </h1>
          <p className="text-[10px] text-blue-400 font-bold truncate mt-0.5 tracking-wide">
            {email}
          </p>
          {localizacao && (
            <p className="flex items-center gap-1 text-[10px] font-medium text-slate-400 mt-1.5">
              <MapPin size={11} className="shrink-0" />
              {localizacao}
            </p>
          )}
        </div>

      </div>

      {/* Chips de contadores */}
      <div className="flex flex-wrap gap-1.5 px-4 py-3 border-t border-slate-100">
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
          <Activity size={10} className="shrink-0" />
          {ativosCount} ativo{ativosCount !== 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
          <Clock size={10} className="shrink-0" />
          {totalCount} projeto{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

    </div>
  )
}