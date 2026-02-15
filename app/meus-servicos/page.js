'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Smartphone,
  LayoutGrid,
  ShieldCheck,
  Search
} from 'lucide-react'
import Link from 'next/link'

export default function PainelDoCliente() {
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [whatsappCliente, setWhatsappCliente] = useState('')
  const [nomeCliente, setNomeCliente] = useState('')

  async function buscarHistorico(whatsapp) {
    setLoading(true)
    const { data } = await supabase
      .from('portfolio_projetos')
      .select(`
        *,
        prestadores (nome, foto_perfil, categoria:categorias(nome))
      `)
      .eq('cliente_whatsapp', whatsapp.replace(/\D/g, ''))
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setServicos(data)
      setNomeCliente(data[0].cliente_nome) // Recupera o nome do registro mais recente
    }
    setLoading(false)
  }

  useEffect(() => {
    const salvo = localStorage.getItem('cliente_whatsapp')
    if (salvo) {
      setWhatsappCliente(salvo)
      buscarHistorico(salvo)
    } else {
      setLoading(false)
    }
  }, [])


  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-[4px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Acessando Arquivos</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-20 font-sans antialiased">
      <div className="max-w-xl mx-auto px-6 pt-12 space-y-10">

        {/* HEADER DO CLIENTE */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">
              Meus<br />Contratos
            </h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] italic">
              Histórico Digital Verificado
            </p>
          </div>
          <div className="bg-slate-100 p-4 rounded-3xl">
            <User size={24} className="text-slate-400" />
          </div>
        </div>

        {/* CARD DE PERFIL RÁPIDO */}
        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase italic text-slate-800 leading-none tracking-tighter">
                {nomeCliente || 'Cliente'}
              </p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">
                {whatsappCliente}
              </p>
            </div>
          </div>
          <div className="bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <p className="text-[8px] font-black text-green-600 uppercase tracking-tighter italic">Conta Ativa</p>
          </div>
        </div>

        {/* LISTAGEM DE SERVIÇOS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Serviços Registrados</p>
            <LayoutGrid size={14} className="text-slate-200" />
          </div>

          {servicos.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <Search size={32} className="mx-auto text-slate-200" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed px-10">
                Nenhum serviço vinculado a este número de WhatsApp foi encontrado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {servicos.map((servico) => (
                <Link
                  key={servico.id}
                  href={`/avaliar/${servico.id}?token=${servico.avaliacao_token}`}
                  className="block group"
                >
                  <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm group-hover:shadow-2xl group-hover:border-blue-100 group-hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
                    <div className="flex items-center gap-5">
                      {/* FOTO DO PRESTADOR */}
                      <div className="relative">
                        <img
                          src={servico.prestadores.foto_perfil}
                          className="w-16 h-16 rounded-3xl object-cover border-2 border-white shadow-md relative z-10"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full z-20 shadow-sm">
                          <ShieldCheck size={12} className="text-blue-600" fill="currentColor" />
                        </div>
                      </div>

                      {/* INFO DO SERVIÇO */}
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md tracking-tighter">
                            {servico.prestadores.categoria?.nome}
                          </span>
                          {servico.status !== 'finalizado' ? (
                            <span className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase italic animate-pulse tracking-tighter">
                              <Clock size={8} /> Em Curso
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase tracking-tighter">
                              <CheckCircle2 size={8} /> Concluído
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black uppercase italic text-slate-800 leading-none tracking-tighter truncate w-40">
                          {servico.titulo}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {servico.prestadores.nome}
                        </p>
                      </div>

                      <ChevronRight className="text-slate-200 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER DE SEGURANÇA */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck size={100} strokeWidth={3} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="space-y-1">
              <p className="text-xl font-black italic uppercase leading-none tracking-tighter">Garantia Verificada</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Todos os serviços são auditados digitalmente.</p>
            </div>
            <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-95 transition-all">
              Ver Certificado Geral
            </button>
          </div>
        </div>

        <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] italic">
          Identity Secured by SeuApp Protocol
        </p>
      </div>
    </div>
  )
}