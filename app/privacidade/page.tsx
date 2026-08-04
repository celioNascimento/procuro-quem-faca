// app/privacidade/page.tsx

'use client'
import { useRouter } from 'next/navigation'

export default function Privacidade() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-20 text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-16 rounded-[3rem] shadow-sm border border-slate-100">
        
        {/* BOTÃO VOLTAR */}
        <button 
          onClick={() => router.back()}
          className="text-blue-600 font-bold text-sm mb-10 flex items-center gap-2 hover:underline group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar
        </button>
        
        <h1 className="text-3xl md:text-4xl font-black mb-8 text-slate-900">Política de Privacidade</h1>
        
        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Coleta de Informações</h2>
            <p>
              Ao utilizar nosso portal, coletamos as informações que você fornece voluntariamente: 
              nome, número de WhatsApp, categoria profissional, cidade e biografia. 
              Estes dados são essenciais para que o serviço de conexão entre prestadores e clientes funcione.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Exibição dos Dados</h2>
            <p>
              Você compreende e aceita que as informações do seu perfil de prestador (incluindo o link direto para seu WhatsApp) 
              ficarão <strong>visíveis publicamente</strong> para qualquer visitante do site que utilize a ferramenta de busca.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Uso de Cookies</h2>
            <p>
              Utilizamos cookies e tecnologias semelhantes apenas para manter você conectado à sua conta (sessão de login) 
              e para garantir a segurança da plataforma através do serviço Supabase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Segurança e Exclusão</h2>
            <p>
              Não vendemos ou compartilhamos seus dados pessoais com empresas de marketing. 
              Você tem o direito total de editar ou <strong>excluir permanentemente</strong> seus dados a qualquer momento 
              através do painel de edição do seu perfil.
            </p>
          </section>

          <section className="pt-8 border-t border-slate-100">
            <p className="text-sm text-slate-400">
              Esta política pode ser atualizada ocasionalmente. O uso continuado do site constitui sua aceitação dos termos.
            </p>
            <p className="text-sm text-slate-400 mt-2 font-bold">
              Última atualização: Janeiro de 2026.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}