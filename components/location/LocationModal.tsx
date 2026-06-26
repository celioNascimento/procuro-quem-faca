'use client'

import { useEffect, useState } from 'react'
import { MapPin, Search, Loader2, X } from 'lucide-react'
import { useLocation } from '../../lib/contexts/LocationContext'
import { getCidadesAtivasParaFiltro } from '@/lib/services/localizacao.service'
import { Cidade } from '@/types/localizacao'

export default function LocationModal() {
  const { isModalOpen, fecharModal, salvarLocalizacao, cidadeAtual } = useLocation()
  const [cidadesAtivas, setCidadesAtivas] = useState<Cidade[]>([])
  const [busca, setBusca] = useState('')
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [erroGeo, setErroGeo] = useState<string | null>(null)

  useEffect(() => {
    if (isModalOpen) {
      getCidadesAtivasParaFiltro().then(setCidadesAtivas)
      setBusca('')
      setErroGeo(null)
    }
  }, [isModalOpen])

  if (!isModalOpen) return null

  const cidadesFiltradas = cidadesAtivas.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const handleSelecionar = (cidade: Cidade) => {
    // Conversão segura do ID para string, blindando a tipagem
    salvarLocalizacao({ id: String(cidade.id), nome: `${cidade.nome} - ${cidade.estado_sigla}` })
  }

  const handleGeolocalizacao = () => {
    setErroGeo(null)
    setLoadingGeo(true)

    if (!navigator.geolocation) {
      setErroGeo('Seu navegador não suporta geolocalização.')
      setLoadingGeo(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`)
          const data = await res.json()
          
          const nomeCidadeEncontrada = data.address.city || data.address.town || data.address.municipality

          if (!nomeCidadeEncontrada) {
            throw new Error('Cidade não identificada na sua localização.')
          }

          const cidadeCorrespondente = cidadesAtivas.find(c => 
            c.nome.toLowerCase() === nomeCidadeEncontrada.toLowerCase()
          )

          if (cidadeCorrespondente) {
            handleSelecionar(cidadeCorrespondente)
          } else {
            setErroGeo(`Ainda não temos profissionais cadastrados em ${nomeCidadeEncontrada}.`)
          }
        } catch (error) {
          setErroGeo('Não conseguimos identificar sua cidade atual.')
        } finally {
          setLoadingGeo(false)
        }
      },
      (error) => {
        setErroGeo('Permissão negada. Por favor, digite sua cidade abaixo.')
        setLoadingGeo(false)
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-6 md:p-8 pb-6 border-b border-slate-50 relative shrink-0">
          {cidadeAtual && (
            <button onClick={fecharModal} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors">
              <X size={20} />
            </button>
          )}
          
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
            <MapPin size={24} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight leading-none mb-2">
            Onde você está?
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Selecione sua cidade para vermos os melhores profissionais perto de você.
          </p>
        </div>

        <div className="p-6 md:p-8 pt-6 flex flex-col gap-6 overflow-hidden">
          
          <div>
            <button 
              onClick={handleGeolocalizacao}
              disabled={loadingGeo}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-70"
            >
              {loadingGeo ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
              {loadingGeo ? 'Buscando...' : 'Usar minha localização'}
            </button>
            {erroGeo && (
              <p className="text-red-500 text-[10px] font-bold text-center mt-3 uppercase tracking-wider">{erroGeo}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ou busque manual</span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="relative mb-4 shrink-0">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Ex: Maringá, Curitiba..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-300 focus:bg-white transition-all"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {cidadesFiltradas.length === 0 ? (
                <p className="text-[11px] font-medium text-slate-400 text-center py-6 italic">Nenhuma cidade encontrada.</p>
              ) : (
                cidadesFiltradas.map((cidade) => (
                  <button
                    key={cidade.id}
                    onClick={() => handleSelecionar(cidade)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left group"
                  >
                    <span className="text-sm font-black text-slate-700 uppercase italic group-hover:text-blue-600 transition-colors">
                      {cidade.nome}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                      {cidade.estado_sigla}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}